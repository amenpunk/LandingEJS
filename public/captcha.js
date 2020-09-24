const myForm = document.getElementById("demo-form")

function onSubmit(token) {

    if( myForm.mail.value == "" ) {
        swal({
            title: "Ups",
            text: "Porfavor ingresa tu email!!",
            icon: "error",
        });
        myForm.mail.focus() ;
        return false;
    }
    if( myForm.password.value == "" ) {
        swal({
            title: "Ups",
            text: "Porfavor ingresa alguna password!!",
            icon: "error",
        });
        myForm.password.focus() ;
        return false;
    }
    
    var mail = document.getElementById('MAIL').value;
    var pass = document.getElementById('PASS')

    console.log(pass)
    if(pass !== null ){
        const regex = new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        const match = regex.test(pass.value)
        if(!match){
            //return document.getElementById("showError").innerHTML = "Password invalida, debe contener: </br> 1 letra minuscula, 1 letra mayuscula, un caracter especial '@,#,$' y debe ser mayor o igual a 8"
            return swal({
                title: "Password invalida!!",
                text: "debe contener: 1 letra minuscula, 1 letra mayuscula, un caracter especial '@,#,$' y debe ser mayor o igual a 8",
                icon: "error",
            });
        }else{
            document.getElementById("showError").innerHTML = "";
        }
    }
    
    if( myForm.nombre && myForm.nombre.value == "" ) {
        swal({
            title: "Ups!!",
            text: "Porfavor ingresa alguna nombre!!",
            icon: "error",
        });
        myForm.nombre.focus() ;
        return false;
    }
    if( myForm.phone && myForm.phone.value == ""  && myForm.phone.length != 8) {
        swal({
            title: "Ups!!",
            text: "Porfavor ingresa alguna telefono valido!!",
            icon: "error",
        });
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
            if(status){
                myForm.submit();
            }else{
                swal({
                    title: "Ups!!",
                    text: "Captcha invalid",
                    icon: "error",
                });
            }
        })
        .catch(error => console.error(error) );
}


function Actualizar(id){
    let lec = document.getElementById(`lec-${id}`)
    let esc  = document.getElementById(`esc-${id}`)
    let mod  = document.getElementById(`mod-${id}`)
    let NuevoPermiso = (lec.checked ? "1" : "0").concat(esc.checked ? "1" : "0").concat(mod.checked ? "1" : "0")
    
    const data = {
        id: id,
        access_code: NuevoPermiso
    };
    fetch('/UpdateRol', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    }).then( response => response.json() )
        .then(result => {
            const {status, message} = result
            if(status){
                swal({
                    title: "Exito!!",
                    text: message,
                    icon: "success",
                });
            }else{
                swal({
                    title: "Ups",
                    text: message,
                    icon: "error",
                });
            }
        })
        .catch(error => {
            console.log("err", error)
            swal({
                title: "Ups",
                text: "Ocurrio un error",
                icon: "error",
            });
        });

}
