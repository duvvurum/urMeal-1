document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('preferences-form');
    const output = document.getElementById('meal-plan-output');
    const mealTable = document.querySelector('.meal-plan-table tbody');
    const ollamaModel = 'qwen:4b';

    function buildPrompt(age, gender, mealPreference, region, allergies, goal) {
        return `Generate an Indian meal plan for a single day for a ${age}-year-old ${gender} who prefers ${mealPreference} food from ${region}, is allergic to ${allergies.length ? allergies.join(', ') : 'none'}, and whose goal is ${goal}.
List the meals for the following times: before breakfast, breakfast, snack, lunch, evening snack, dinner, before bed snack.
Format the output as a markdown table with columns: Time, Meal.
Only output the markdown table, nothing else.`;
    }

    async function fetchMealPlan(prompt) {
        const response = await fetch(
            'http://localhost:3000/generate-meal-plan',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            }
        );
        const data = await response.json();
        return data.response || '';
    }

    function parseMealPlanTable(text) {
        // Simple parser for markdown tables
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const tableLines = lines.filter(line => line.includes('|'));
        const rows = tableLines.slice(2); // Skip header and separator
        return rows.map(row => row.split('|').map(cell => cell.trim()).slice(1, -1));
    }

    if (form && output && mealTable) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(form);
            const age = formData.get('age');
            const gender = formData.get('gender');
            const mealPreference = formData.get('mealPreference');
            const region = formData.get('region');
            const allergies = formData.getAll('allergies');
            const goal = formData.get('goal');

            // Display preferences on right section
            output.innerHTML = `
                <h3>Your Selected Preferences</h3>
                <ul>
                    <li><strong>Age:</strong> ${age}</li>
                    <li><strong>Gender:</strong> ${gender}</li>
                    <li><strong>Meal Preference:</strong> ${mealPreference}</li>
                    <li><strong>Region:</strong> ${region}</li>
                    <li><strong>Food Allergies:</strong> ${allergies.length ? allergies.join(', ') : 'None'}</li>
                    <li><strong>Goal:</strong> ${goal}</li>
                </ul>
                <button id="confirm-btn">Confirm</button>
            `;

            document.getElementById('confirm-btn').onclick = async function () {
                output.innerHTML += `<p>Generating meal plan...</p>`;
                const prompt = buildPrompt(age, gender, mealPreference, region, allergies, goal);
                try {
                    const mealPlanText = await fetchMealPlan(prompt);
                    console.log('LLM response:', mealPlanText); // Debug: See what Ollama returns
                    // Parse and render the markdown table
                    const parsedRows = parseMealPlanTable(mealPlanText);
                    if (parsedRows.length === 0) {
                        output.innerHTML += `<p style="color:red;">Meal plan could not be parsed. See console for details.</p>`;
                        return;
                    }
                    // Render the table below the preferences
                    let tableHtml = `
                        <h3>Today's Meal Plan</h3>
                        <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Meal</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    parsedRows.forEach(cells => {
                        tableHtml += `<tr><td>${cells[0] || ''}</td><td>${cells[1] || ''}</td></tr>`;
                    });
                    tableHtml += `
                            </tbody>
                        </table>
                    `;
                    output.innerHTML += tableHtml + `<p>Meal plan generated!</p>`;
                } catch (err) {
                    output.innerHTML += `<p style="color:red;">Failed to generate meal plan.</p>`;
                }
            };
        });
    }
});