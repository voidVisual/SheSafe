// Splash Screen Handler
window.onload = function () {
    setTimeout(function () {
        const token = localStorage.getItem('shesafe_token');
        if (token) {
            window.location.href = 'home.html';
        } else {
            window.location.href = 'login.html';
        }
    }, 2200);
};