const register = (app, db) => {
    app.get('/new', async (c) => { return await get(c, db) })

    // Add new receipt
    app.post('/new', async (c) => {
    const formData = await c.req.parseBody();
    const { date, location_id } = formData;

    // Validate inputs
    if (!date || !location_id) {
        throw new Error('Missing required fields');
    }

    const result = await db.run(`
        INSERT INTO receipts (date, location_id)
        VALUES (?, ?)
    `, [date, location_id]);

    return c.redirect(`${result.lastID}/`);
    });
}

const get = async (c, db) => {
    // Get locations with store names for dropdown
    const locations = await db.all(`
        SELECT locations.id, locations.store_id, locations.address, stores.name
        FROM locations
        JOIN stores ON locations.store_id = stores.id
        ORDER BY stores.name
    `);
    
    return c.html(`
        <h1>New Receipt</h1>
        <form method="POST">
            <div>
                <label for="date">Date:</label>
                <input type="date" id="date" name="date" required 
                    value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div>
                <label for="location_id">Location:</label>
                <select id="location_id" name="location_id" required>
                    <option value="">Select a location...</option>
                    ${locations.map(loc => 
                        `<option value="${loc.id}">${loc.name} - ${loc.address}</option>`
                    ).join('')}
                </select>
            </div>

            <button type="submit">Create Receipt</button>
        </form>
    `);
}

module.exports = {
    register
}