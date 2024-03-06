$(".info-item .btn").click(function () {
  $(".container").toggleClass("log-in");
});
$(".container-form .btn").click(function () {
  $(".container").addClass("active");
});
// Add event listener to the div button
document.getElementById("loginButton").addEventListener("click", function() {
    // Submit the form when the div is clicked
    document.getElementById("loginForm").submit();
});

document.getElementById("signupButton").addEventListener("click", function() {
    // Submit the form when the div is clicked
    document.getElementById("signupForm").submit();
});