const myForm = document.getElementById("demo-form")

function onSubmit(token) {
    

    if( myForm.mail.value == "" ) {
        alert( "Porfavor ingresa tu email!!" );
        myForm.mail.focus() ;
        return false;
    }
    if( myForm.password.value == "" ) {
        alert( "Porfavor ingresa alguna password!!" );
        myForm.password.focus() ;
        return false;
    }
    
    var mail = document.getElementById('MAIL').value;
    var pass = document.getElementById('PASS')

    if(pass !== null ){
        const regex = new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        const match = regex.test(pass.value)
        if(!match){
            return document.getElementById("showError").innerHTML = "Password invalida, debe contener: </br> 1 letra minuscula, 1 letra mayuscula, un caracter especial '@,#,$' y debe ser mayor o igual a 8"
        }

    }
    
    if( myForm.nombre.value == "" ) {
        alert( "Porfavor ingresa alguna nombre!!" );
        myForm.nombre.focus() ;
        return false;
    }
    if( myForm.phone.value == "" ) {
        alert( "Porfavor ingresa alguna telefono!!" );
        myForm.phone.focus() ;
        return false;
    }

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
            console.log(status, message)
            if(result){
                myForm.submit();
            }
        })
        .catch(error => console.error(error) );
}
