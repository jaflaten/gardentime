document.addEventListener('alpine:init', () => {

    const baseUrl = "http://localhost:8080/api"

    const data = {
        gardens: [],
        errorMessage: '',
    }

    Alpine.data('alpineFunctions', () => ({
        ...data,

        getGardens: function (e) {
            fetchData(baseUrl + "/garden", "GET", null, this)
                .then(data => {
                    this.gardens = data
                    console.debug("fetch all gardens "+data)
                })
        },

        createGarden: function (e) {
            fetchData(baseUrl + "/garden/test", "POST", null, this)
                .then(data => {
                    this.gardens = [data, ...(this.gardens || [])];
                    console.debug("created "+ data)
                })
        },

        deleteGarden: function(id) {
            fetchData(baseUrl + `/garden/${id}`, "DELETE", null, this)
                .then(data => {
                    this.gardens = this.gardens.filter(garden => garden.id !== id);
                    console.debug("deleted "+id)
                })
        }

    }))

    function fetchData(endpoint, method, body, obj) {
        return fetch(endpoint, {
            method: method,
            if(body) {body: JSON.stringify(body)},
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.status === 200 || response.status === 201) {
                    return response.json();
                } else if (response.status === 204) {
                    return null
                } else {
                    return Promise.reject(response);
                }
            })
            .catch(err => handleErrorResponse(err, obj));
    }

    function handleErrorResponse(error, obj) {
        if (error instanceof Response) {
            error.json().then(errorJson => {
                console.error(errorJson)
                obj.errorMessage = errorJson.error;
                throw new Error(errorJson.error);
            })
        } else {
            console.error("Non-response error:", error);
            throw error;
        }

        throw new Error("FetchAPI error");
    }

})