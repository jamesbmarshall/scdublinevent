// public/js/random.js

document.addEventListener('DOMContentLoaded', async () => {
    await loadPlaceholderImages();
    document.getElementById('newImageButton').addEventListener('click', startRandomSpin);
    startRandomSpin();
});

let placeholderImages = [];

async function loadPlaceholderImages() {
    try {
        const response = await fetch('/get-images');
        if (!response.ok) {
            throw new Error(`Failed to load images. Status: ${response.status}`);
        }
        const data = await response.json();
        placeholderImages = data.images.map(item => item.image).filter(Boolean);
        if (placeholderImages.length === 0) {
            console.warn('No approved images found. Using a fallback placeholder.');
            placeholderImages = ['/images/fallback.jpg'];
        }
    } catch (error) {
        console.error('Error fetching placeholder images:', error);
        placeholderImages = ['/images/fallback.jpg'];
    }
}

function startRandomSpin() {
    const imageElement = document.getElementById('randomImage');
    const textElement = document.getElementById('imageText');
    const errorMessage = document.getElementById('errorMessage');

    imageElement.src = '';
    imageElement.alt = '';
    textElement.textContent = '';
    errorMessage.textContent = '';
    imageElement.classList.remove('final-image-pulse');

    if (placeholderImages.length === 0) {
        return fetchFinalRandomImage();
    }

    let interval = 100;
    let spinCount = 0;
    const maxSpins = 10;

    function spinStep() {
        const randomPlaceholder = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
        imageElement.src = ''; // Clear first to ensure reload
        imageElement.src = randomPlaceholder + '?t=' + Date.now(); // Add query param to ensure new request
        imageElement.alt = 'Spinning...';
        imageElement.style.opacity = '1';

        spinCount++;
        if (spinCount < maxSpins) {
            interval += 100; 
            setTimeout(spinStep, interval);
        } else {
            fetchFinalRandomImage();
        }
    }

    spinStep();
}

async function fetchFinalRandomImage() {
    const imageElement = document.getElementById('randomImage');
    const textElement = document.getElementById('imageText');
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch('/random-image');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Clear src first to force fresh load
        imageElement.src = '';
        // Add a timestamp to ensure this load triggers onload
        imageElement.src = data.image + '?t=' + Date.now(); 
        imageElement.alt = 'Final Random Image';
        imageElement.style.opacity = '1';

        if (data.text) {
            const textResponse = await fetch(data.text);
            if (!textResponse.ok) {
                throw new Error(`Failed to load text. Status: ${textResponse.status}`);
            }
            const textData = await textResponse.text();
            textElement.textContent = textData;
            imageElement.alt = textData;
        } else {
            textElement.textContent = 'No associated text available.';
        }

        // Apply the pulse effect once the image has fully loaded
        imageElement.onload = () => {
            imageElement.classList.remove('final-image-pulse');
            // Reflow trigger (optional, may not be needed)
            void imageElement.offsetWidth;
            // Re-add the class to restart the animation
            imageElement.classList.add('final-image-pulse');
        };

    } catch (error) {
        console.error('Error fetching random image:', error);
        errorMessage.textContent = 'Failed to load random image. Please try again later.';
    }
}