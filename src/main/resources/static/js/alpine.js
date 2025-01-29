document.addEventListener('alpine:init', () => {

    const baseUrl = "http://localhost:8080/api"

    const data = {
        view: 'gardens',
        selectedGarden: '',
        selectedGrowZone: '',
        selectedCropRecord: '',
        userGardens: [],
        errorMessage: '',
        userId: 'f1234abc-5678-90de-abcd-ef1234567890',
        gardens: []
    }

    Alpine.data('alpineFunctions', () => ({
        ...data,

        // VIEWS

        viewSelectedGarden: function (gardenId) {
            this.view = 'garden'
            this.selectedGarden = gardenId
        },

        viewSelectedGrowZone: function (selectedGarden, growZoneId) {
            this.view = 'growZone'
            this.selectedGrowZone = this.gardens[selectedGarden].growZones.find(
                (growZone) => growZone.id === growZoneId
            );
        },

        viewSelectedCropRecord: function (selectedGrowZone, cropRecordId) {
            this.view = 'cropRecord'
            this.selectedCropRecord = selectedGrowZone.cropRecord.find(
                (cropRecord) => cropRecord.id === cropRecordId
            );

        },

        // REST

        getGardensByUserId: function (e) {
            fetchData(baseUrl + `/garden/user/${data.userId}`, "GET", null, this)
                .then(data => {
                    this.userGardens = data
                    console.info("fetch all gardens "+JSON.stringify(data))
                })
        },

        getGardenById: function (gardenId) {
            fetchData(baseUrl + `/garden/${gardenId}`, "GET", null, this)
                .then(data => {
                    console.info("fetch gardens by id "+JSON.stringify(data))
                    this.gardens[gardenId] = data


                    console.info(JSON.stringify(this.gardens[gardenId]))
                })
        },

        createGarden: function (e) {
            fetchData(baseUrl + "/garden/test", "POST", null, this)
                .then(data => {
                    this.userGardens = [data, ...(this.userGardens || [])];
                    console.info("created "+ JSON.stringify(data))
                })
        },

        deleteGarden: function(id) {
            fetchData(baseUrl + `/garden/${id}`, "DELETE", null, this)
                .then(data => {
                    this.userGardens = this.userGardens.filter(garden => garden.id !== id);
                    console.info("deleted "+id)
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