const rp = require('request-promise')

const functionInvoke = ({gateway, name, payload, json}) => {
    return rp({
        uri: gateway + '/function/' + name,
        method: 'POST',
        body: payload,
        json: json
    }).then((response) => Promise.resolve(tryParse(response)))
}

const functionList = ({gateway}) => {
    return rp({
        uri: gateway + '/system/functions',
        method: 'GET',
        json: true
    })
}

const functionExists = ({gateway, name}) => {
    return functionList({gateway}).then((functions) => Promise.resolve(functions.filter((f) => f.name === name).length > 0))
}

const tryParse = (json) => {
    try {
        return JSON.parse(json)
    } catch(e) {
        return json
    }
}

module.exports = function(RED) {

    function OpenFaaS(config) {
        RED.nodes.createNode(this, config)
        this.name = config.name
        this.gateway = config.gateway
        var node = this

        this.on('input', function(msg) {
            const payload = tryParse(msg.payload)
            const json = payload !== msg.payload

            functionExists({node.gateway, node.name}).then((exists) => {
                if(exists) {
                    return functionInvoke({node.gateway, node.name, payload, json})
                        .then((payload) => {
                            msg.payload = payload
                            node.send(msg)
                        })
                }
            }).catch((e) => node.error(e.message))
        })
    }

    RED.nodes.registerType('openfaas', OpenFaaS)
}
