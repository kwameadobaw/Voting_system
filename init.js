// This script initializes the local storage with data from JSON files
// It should be included in the index.html file

document.addEventListener('DOMContentLoaded', function() {
    // Initialize students data if not already set
    if (!localStorage.getItem('students')) {
        fetch('students.json')
            .then(response => response.json())
            .then(data => {
                localStorage.setItem('students', JSON.stringify(data.students));
                console.log('Students data initialized');
            })
            .catch(error => console.error('Error initializing students data:', error));
    }
    
    // Initialize positions data if not already set
    if (!localStorage.getItem('positions')) {
        fetch('positions.json')
            .then(response => response.json())
            .then(data => {
                localStorage.setItem('positions', JSON.stringify(data.positions));
                console.log('Positions data initialized');
            })
            .catch(error => console.error('Error initializing positions data:', error));
    }
    
    // Initialize votes if not already set
    if (!localStorage.getItem('votes')) {
        localStorage.setItem('votes', JSON.stringify([]));
        console.log('Votes data initialized');
    }
});