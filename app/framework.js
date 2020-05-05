const axios = require('axios');


exports.GetIdentity = () => {

    axios.post('http://localhost:3000/extension/identity', {
    })
        .then((res) => {
            console.log(`statusCode: ${res.statusCode}`)
            console.log(res)
        })
        .catch((error) => {
            console.error(error)
        })

};
