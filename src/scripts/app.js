document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('preferences-form');
    const output = document.getElementById('meal-plan-output');
    const mealTable = document.querySelector('.meal-plan-table tbody');
    const ollamaModel = 'qwen:4b';

    function buildPrompt(age, gender, mealPreference, region, allergies, goal) {
        return `Generate Indian meal plan for a ${age}-year-old ${gender} who prefers ${mealPreference} food from ${region}, is allergic to ${allergies.length ? allergies.join(', ') : 'none'}, and whose goal is ${goal}.
List meals for each day: before breakfast, breakfast, snack, lunch, evening snack, dinner, before bed snack.
`;
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
                    // Parse and update table
                    const parsedRows = parseMealPlanTable(mealPlanText);
                    if (parsedRows.length === 0) {
                        output.innerHTML += `<p style="color:red;">Meal plan could not be parsed. See console for details.</p>`;
                        return;
                    }
                    parsedRows.forEach((cells, idx) => {
                        if (mealTable.rows[idx]) {
                            for (let i = 1; i < mealTable.rows[idx].cells.length; i++) {
                                mealTable.rows[idx].cells[i].textContent = cells[i] || '';
                            }
                        }
                    });
                    output.innerHTML += `<p>Meal plan generated!</p>`;
                } catch (err) {
                    output.innerHTML += `<p style="color:red;">Failed to generate meal plan.</p>`;
                }
            };
        });
    }
});