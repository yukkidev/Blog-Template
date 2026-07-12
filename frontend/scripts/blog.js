const container = document.getElementById('posts');
const singlePostViewContainer = document.getElementById('singlePostViewContainer');
const singlePostTitle = document.getElementById('singlePostTitle');
const singlePostContent = document.getElementById('singlePostContent');
const singlePostTimestamp = document.getElementById('singlePostTimestamp');
const closeButton = document.getElementById('closeButton');

const maxPostLength = 800;

function displaySinglePost(post) {
  singlePostTitle.textContent = post.title;
  singlePostContent.innerHTML = post.body;
  singlePostTimestamp.textContent = post.date;
  singlePostViewContainer.style.display = 'block';
  container.style.display = 'none';
}

function truncatePost(post) {
  if (post.body.length > maxPostLength) {
    const truncatedText = post.body.substring(0, maxPostLength);
    const lastSpaceIndex = truncatedText.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
      return truncatedText.substring(0, lastSpaceIndex) + '...';
    } else {
      return truncatedText + '...';
    }
  }
  return post.body;
}

function closeSinglePostView() {
  singlePostViewContainer.style.display = 'none';
  container.style.display = 'block';
}

function loadPostFromQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const postIndex = parseInt(urlParams.get('post'));

  fetch(`${API_URL}/posts`)
    .then(response => response.json())
    .then(posts => {
      const post = posts[postIndex];
      if (post) {
        displaySinglePost(post);
      } else {
        console.error('Post not found');
      }
    })
    .catch(error => {
      console.error(error);
    });
}

fetch(`${API_URL}/posts`)
  .then(response => response.json())
  .then(posts => {
    posts.reverse().forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'post';

      const title = document.createElement('h2');
      title.textContent = post.title;
      postDiv.appendChild(title);

      const content = document.createElement('p');
      const truncatedContent = truncatePost(post);
      content.innerHTML = truncatedContent;
      postDiv.appendChild(content);

      const timestamp = document.createElement('p');
      timestamp.textContent = post.date;
      postDiv.appendChild(timestamp);

      if (post.body.length > maxPostLength) {
        const continueReadingButton = document.createElement('button');
        continueReadingButton.textContent = 'Continue reading';
        continueReadingButton.className = 'button';
        continueReadingButton.addEventListener('click', () => {
          displaySinglePost(post);
        });
        postDiv.appendChild(continueReadingButton);
        content.classList.add('gradient');
      }

      container.appendChild(postDiv);
    });
  })
  .catch(error => {
    console.error(error);
  });

if (window.location.search.includes('post=')) {
  loadPostFromQuery();
}

closeButton.addEventListener('click', closeSinglePostView);
