function onSubmit(token) {

    var mail = document.getElementById('MAIL').value;
    var data = {
        value: mail,
        token: token
    };

    fetch('/verify', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    }).then( response => response.json() )
        .then(result => {
            const {status, message} = result
            alert(message)
            if(result){
                document.getElementById("demo-form").submit();
            }
        })
        .catch(error => console.error(error) );
}
