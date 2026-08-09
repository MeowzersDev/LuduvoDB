// 1. Grab the HTML elements we want to interact with
const button = document.getElementById('actionButton');
const messageArea = document.getElementById('messageArea');

let clickCount = 0;

// 2. Tell the button what to do when it gets clicked
button.addEventListener('click', () => {
    // Increase the click counter
    clickCount++;
    
    // Update the text on the screen
    messageArea.textContent = `You clicked the button ${clickCount} times!`;
    
    // Generate a random hex color code
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    
    // Apply the random color to the page background
    document.body.style.backgroundColor = "#" + randomColor;
});
