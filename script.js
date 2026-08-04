window.onload = function(){

    setTimeout(function(){

        document.getElementById("loading").style.display="none";

        document.getElementById("content").style.display="block";

        getLocation();

    },2500);

}

setTimeout(function () {
    window.location.href = "signup.html";
}, 3000);