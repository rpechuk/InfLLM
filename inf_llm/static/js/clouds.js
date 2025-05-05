const directoryNav = document.getElementById('directory-nav');
const imageViewer = document.getElementById('image-viewer');

// show loading message
directoryNav.innerHTML = '<div style="text-align:center; padding:20px;">Loading directory structure...</div>';

function createDirectoryView(structure) {
  // clear existing content
  directoryNav.innerHTML = '<h2>Cloud Images</h2>';

  function processDirectory(dir, parentElement) {
    if (dir.type !== "directory") return;

    const dirDiv = document.createElement('div');
    dirDiv.className = 'directory';

    const dirHeader = document.createElement('div');
    dirHeader.className = 'directory-name';
    dirHeader.innerHTML = `${dir.name} <span class="toggle-icon">+</span>`;

    const filesDiv = document.createElement('div');
    filesDiv.className = 'directory-files';

    // toggle directory expansion
    dirHeader.addEventListener('click', () => {
      if (filesDiv.style.display === 'block') {
        filesDiv.style.display = 'none';
        dirHeader.querySelector('.toggle-icon').textContent = '+';
      } else {
        filesDiv.style.display = 'block';
        dirHeader.querySelector('.toggle-icon').textContent = '-';
      }
    });

    // process children (files and subdirs)
    if (dir.children && dir.children.length > 0) {
      dir.children.forEach(child => {
        if (child.type === "directory") {
          // recursively process subdir
          processDirectory(child, filesDiv);
        } else if (child.type === "file") {
          // file element
          const fileDiv = document.createElement('div');
          fileDiv.className = 'file';
          fileDiv.textContent = child.name;

          // click handler for image file
          fileDiv.addEventListener('click', (e) => {
            document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));

            fileDiv.classList.add('active');
            const imagePath = `/static/clouds/${child.path}`;
            imageViewer.innerHTML = `
                  <div class="image-title">${child.path}</div>
                  <img class="cloud-image" src="${imagePath}" alt="${child.path}" loading="lazy" />
                `;
          });

          filesDiv.appendChild(fileDiv);
        }
      });
    } else {
      // empty directory
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-dir';
      emptyDiv.textContent = 'Empty directory';
      filesDiv.appendChild(emptyDiv);
    }

    // add directory to parent
    dirDiv.appendChild(dirHeader);
    dirDiv.appendChild(filesDiv);
    parentElement.appendChild(dirDiv);
  }

  // start from root
  if (structure.children && structure.children.length > 0) {
    structure.children.forEach(child => {
      if (child.type === "directory") {
        processDirectory(child, directoryNav);
      }
    });
  }

  // open the first directory by default
  if (directoryNav.querySelector('.directory-name')) {
    directoryNav.querySelector('.directory-name').click();
  }
}

function handleDirectoryError(error) {
  let errorMessage = error.message || 'Unknown error';
  let suggestion = '';

  // err msg
  if (error.message && error.message.includes('Cloud directory not found')) {
    suggestion = 'Make sure the "clouds" directory exists in static directory.';
  } else if (error.message && error.message.includes('HTTP error')) {
    suggestion = 'The server might be experiencing issues. Try again later.';
  } else if (error.message && error.message.includes('NetworkError')) {
    suggestion = 'Check your internet connection.';
  }

  directoryNav.innerHTML = `
        <h2>Cloud Images</h2>
        <div style="color: red; padding: 10px;">
          Error loading directory structure: ${errorMessage}
        </div>
        <div style="padding: 0 10px 10px 10px; font-style: italic;">
          ${suggestion}
        </div>
        <button id="retry-btn" style="margin: 10px; padding: 5px 10px;">Retry</button>
      `;

  // add retry button handler
  document.getElementById('retry-btn').addEventListener('click', fetchDirectoryStructure);
}

function fetchDirectoryStructure() {
  fetch('/cloud-directory')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      createDirectoryView(data);
    })
    .catch(error => {
      console.error('Error fetching directory structure:', error);
      handleDirectoryError(error);
    });
}

fetchDirectoryStructure();