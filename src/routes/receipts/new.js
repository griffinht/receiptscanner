const register = (app, db) => {
    app.get('/new', async (c) => { return await get(c, db) })
}

const get = async (c, db) => {
    return c.html(`new receipt`)
}

module.exports = {
    register
}