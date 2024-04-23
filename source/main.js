// Panzoom receptacle
let panzoom;

// Max. chars for stickies
const maxChars = 240;

// Wait for fully loaded DOM
document.addEventListener('DOMContentLoaded', function () {

    // Initialize Panzoom on <main>
    const board = document.querySelector('main');
    if (board) {
        panzoom = Panzoom(board, {
            disableZoom: true,

            // Exclude elements from Panzoom behaviors
            exclude: [...document.querySelectorAll('*:not(main)')]
        });
    }
    // Put listeners on stickies
    document.querySelectorAll('article p[contenteditable="true"]').forEach(listenPar);

    // Add click listeners to each stickie
    document.querySelector('main').addEventListener('click', (event) => {
        const theArticle = event.target.closest('article');

        // If the clicked element is not inside an article, ignore the click.
        if (!theArticle) return;

        // Remove `.selection` from all articles
        document.querySelectorAll('article').forEach(el => el.classList.remove('selection'));

        // Add `.selection` class to clicked article
        theArticle.classList.add('selection');
    });
    // Handle keyboard events
    document.addEventListener('keydown', function (event) {

        // Check if the event target is editable
        if (event.target.matches('article p[contenteditable="true"]')) {

            // Use Enter key to create stickies
            if (event.key === "Enter") {

                // Prevent Enter's default
                event.preventDefault();

                // Get selected direction from nav
                const direction = document.querySelector('nav .selection')?.classList[0];

                // Add stickie in selected direction
                addStickie(event.target.closest('article'), direction);

                // Use Backspace/Delete keys to delete stickies
            } else if ((event.key === "Backspace" || event.key === "Delete") && event.target.innerText
                .trim() === "") {

                // Prevent Backspace/Delete's default
                event.preventDefault();

                // First see if there is more than one skickie
                if (document.querySelectorAll('article').length > 1) {

                    // Delete stickie
                    deleteStickie(event.target.closest('article'));
                }
            }
        } else {
            // Use navigation
            navKeys(event);
        }
    });
});
// Attaches event listeners to stickies
function listenPar(editStickie) {

    // Get closest article parent
    const theArticle = editStickie.closest('article');

    // Ensure charCounter is declared at a scope accessible to all relevant blocks.
    let charCounter = theArticle.querySelector('.counter');

    // Create counter
    if (!charCounter) {
        charCounter = document.createElement('small');
        charCounter.classList.add('counter');
        charCounter.style.display = 'none'; // Initially hide it
        theArticle.appendChild(charCounter);
    }
    // When stickie is focused
    editStickie.addEventListener('focus', function () {

        // Show the counter and update it
        charCounter.style.display = '';
        updateCounter(editStickie, charCounter);

        // Highlight the focused stickie
        document.querySelectorAll('article').forEach(el => el.classList.remove('selection'));
        theArticle.classList.add('selection');
    });
    // Blur event: Hide the counter and remove stickie highlight
    editStickie.addEventListener('blur', function () {
        charCounter.style.display = 'none';
        theArticle.classList.remove('selection');
    });
    // Handle paste event: accept, clean up and paste
    editStickie.addEventListener('paste', function (event) {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        updateCounter(editStickie, charCounter);
    });
    // Input event: Update counter as user types
    editStickie.addEventListener('input', function () {
        updateCounter(editStickie, charCounter);
    });
    // Add event listener for handling direction changes with keyboard shortcuts
    editStickie.addEventListener('keydown', navKeys);
}
// Count chars
function updateCounter(editStickie, charCounter) {
    const textLength = editStickie.innerText.trim().length;
    charCounter.textContent = `${textLength}/${maxChars}`;
    if (textLength > 0) {
        editStickie.classList.add('has-value');
    } else {
        editStickie.classList.remove('has-value');
    }
}
// Toggle the visual indication of whether a stickie is empty
function togglePlaceholder(editStickie) {
    const isEmpty = editStickie.innerText.trim() === '';
    editStickie.classList.toggle('has-value', !isEmpty);
}
// Current max references for grid calculation
let maxColumn = 'a', maxRow = 1;

// Function to update the main grid layout
function updateGridLayout(newCol, newRow) {
    let gridTemplateString = document.querySelector('main').style.gridTemplateAreas;
    console.log(`Original grid-template-areas: ${gridTemplateString}`);

    // Remove single quotes for manipulation
    let rows = gridTemplateString.length > 0 ? gridTemplateString.split('\'').filter(x => x.trim().length > 0).map(r => r.trim().split(' ')) : [];
    console.log(`Initial rows: ${JSON.stringify(rows)}`);

    // Ensure there are enough rows
    while (rows.length < newRow) {
        rows.push(new Array(rows[0] ? rows[0].length : 1).fill('.'));
    }

    // Ensure all rows are the right length
    let maxCols = Math.max(...rows.map(row => row.length), newCol.charCodeAt(0) - 'a'.charCodeAt(0) + 1);
    rows.forEach(row => {
        while (row.length < maxCols) {
            row.push('.');
        }
    });

    // Place the new sticky in the correct column
    rows[newRow - 1][newCol.charCodeAt(0) - 'a'.charCodeAt(0)] = `${newCol}${newRow}`;
    console.log(`Modified rows before cleanup: ${JSON.stringify(rows)}`);

    // Clean up unnecessary placeholders and quotation marks
    rows = rows.map(row => {
        let cleanedRow = row.map(item => item.replace(/"/g, ''));
        let lastNonDotIndex = cleanedRow.lastIndexOf(cleanedRow.findLast(r => r !== '.'));
        return cleanedRow.slice(0, lastNonDotIndex + 1);
    });
    console.log(`Modified rows after cleanup: ${JSON.stringify(rows)}`);

    // Reassemble the grid-template-areas string properly
    gridTemplateString = rows.map(row => `'${row.join(' ')}'`).join(' ');
    document.querySelector('main').style.gridTemplateAreas = gridTemplateString;
    console.log(`Updated grid-template-areas: ${gridTemplateString}`);
}

// Revised addStickie function to apply style to article and label it
function addStickie(refStickie, direction) {
    console.log(`Adding stickie in direction: ${direction}`);
    const newSection = document.createElement('section');
    const newArticle = document.createElement('article');
    const newParagraph = document.createElement('p');
    newParagraph.setAttribute('contenteditable', 'true');
    newParagraph.setAttribute('tabindex', '0');
    const charCounter = document.createElement('small');
    charCounter.classList.add('counter');
    charCounter.style.display = 'none';
    charCounter.textContent = '0/240';
    newArticle.appendChild(newParagraph);
    newArticle.appendChild(charCounter);
    newSection.appendChild(newArticle);

    let newCol = maxColumn, newRow = maxRow;
    if (direction === 'east') {
        newCol = nextColumn(maxColumn);
        if (newCol.charCodeAt(0) - 'a'.charCodeAt(0) >= maxColumn.charCodeAt(0) - 'a'.charCodeAt(0)) {
            maxColumn = newCol; // Only update if the new column is actually to the right
        }
    } else if (direction === 'south') {
        newRow++;
        if (newRow > maxRow) {
            maxRow = newRow; // Only update if the new row is actually below
        }
    }

    newArticle.style.gridArea = `${newCol}${newRow}`;
    newArticle.setAttribute('data-stickie', document.querySelectorAll('article').length.toString());
    if (direction === 'east' || direction === 'south') {
        refStickie.closest('section').after(newSection);
    } else {
        refStickie.closest('section').before(newSection);
    }

    listenPar(newParagraph);
    document.querySelectorAll('article').forEach(el => el.classList.remove('selection'));
    newArticle.classList.add('selection');
    newParagraph.focus();

    updateGridLayout(newCol, newRow);
}
// Ensure nextColumn always returns a string
function nextColumn(col) {
    console.log(`Calculating next column for ${col}`);
    if (col === 'z') return 'aa';
    let lastChar = col.slice(-1);
    let increment = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    return col.slice(0, -1) + increment;
}
// Delete a stickie
function deleteStickie(theArticle) {

    // Find the closest parent
    const theSection = theArticle.closest('section');

    // Determine the next element to focus on after the deletion
    let nextElement = theSection.nextElementSibling || theSection.previousElementSibling;
    if (nextElement) {

        // Find the stickie and focus on it
        let nextP = nextElement.querySelector('p[contenteditable="true"]');
        if (nextP) {
            nextP.focus();
        }
    }
    // Actually delete the stickie
    theSection.remove();
}
// Handle navigation keys to change the selection of stickies
function navKeys(event) {

    // Mapping for navigation with double modifiers
    const directionMap = {
        'ArrowRight': 'east',
        'ArrowDown': 'south',
        'ArrowLeft': 'west',
        'ArrowUp': 'north'
    };
    // Check if both Ctrl (Cmd on Mac) and Alt are pressed along with the direction keys
    if (event.ctrlKey && event.altKey && Object.keys(directionMap).includes(event.key)) {
        event.preventDefault();
        const directionClass = directionMap[event.key];
        document.querySelectorAll('nav button').forEach(el => el.classList.remove('selection'));
        const directionActually = document.querySelector(`nav button.${directionClass}`);
        if (directionActually) {
            directionActually.classList.add('selection');
        }
    }
}