document.getElementById("puesto").addEventListener('change', async function() {

    let selected = this.value;
    let data = {
        role : selected
    }
    const gg = new Promise(function (resolve, reject) {

        fetch('/UserList', {
            
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
            })
            .then( response => response.json() )
            .then(result => {
                return resolve(result)
            })
            .catch(error =>{
                return resolve(error)
            })

    })

    var select = document.getElementById("user");
    var length = select.options.length;
    for (i = length-1; i >= 0; i--) {
      select.options[i] = null;
    }
    const result = await Promise.resolve(gg)
    result.forEach( ele => {
        let opt = document.createElement('option');
        opt.text = ele.nombre
        opt.value = ele.id.shift()
        user.appendChild(opt)
    })

})

