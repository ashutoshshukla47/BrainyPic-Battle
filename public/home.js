/*home.html*/
const btn=document.querySelector("#submit");
const homeuser=document.querySelector(".textbox");
let username="";
btn.addEventListener("click",()=>{
    username=homeuser.value;
    sessionStorage.setItem("username",username);
    window.location.href = "home.html";
})

const openBtn = document.getElementById('openContactPanel');
const closeBtn = document.getElementById('closeContactPanel');
const panel = document.getElementById('contactPanel');

// Open the panel when the button is clicked
if (openBtn && panel) {
    openBtn.addEventListener('click', () => {
        panel.style.width = '250px';  // Open the panel
    });
}

// Close the panel when the close button is clicked
if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
        panel.style.width = '0';  // Close the panel
    });
}
