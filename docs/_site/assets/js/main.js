/* eslint-env browser */
// Table of Contents Generator
document.addEventListener('DOMContentLoaded', function() {
  // Generate TOC for documentation pages
  const tocContainer = document.getElementById('table-of-contents');
  const content = document.querySelector('.content');
  
  if (tocContainer && content) {
    const headings = content.querySelectorAll('h2, h3');
    const toc = document.createElement('ul');
    toc.className = 'toc-list';
    
    let currentH2 = null;
    let currentH2List = null;
    
    headings.forEach(function(heading) {
      const id = heading.id || heading.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      heading.id = id;
      
      const link = document.createElement('a');
      link.href = '#' + id;
      link.textContent = heading.textContent;
      link.className = 'toc-link';
      
      const li = document.createElement('li');
      li.appendChild(link);
      
      if (heading.tagName === 'H2') {
        currentH2 = li;
        currentH2List = document.createElement('ul');
        currentH2List.className = 'toc-sublist';
        currentH2.appendChild(currentH2List);
        toc.appendChild(currentH2);
      } else if (heading.tagName === 'H3' && currentH2List) {
        currentH2List.appendChild(li);
      }
      
      // Smooth scroll to section
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById(id);
        if (target) {
          const offset = 80; // Account for fixed header
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
    
    if (toc.children.length > 0) {
      tocContainer.appendChild(toc);
    }
  }
  
  // Highlight current section in TOC
  const observerOptions = {
    rootMargin: '-80px 0px -70% 0px',
    threshold: 0
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      const id = entry.target.id;
      const tocLink = document.querySelector(`.toc-link[href="#${id}"]`);
      
      if (tocLink) {
        if (entry.isIntersecting) {
          document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
          tocLink.classList.add('active');
        }
      }
    });
  }, observerOptions);
  
  // Observe all headings
  document.querySelectorAll('.content h2, .content h3').forEach(function(heading) {
    observer.observe(heading);
  });
  
  // Copy code button
  document.querySelectorAll('pre').forEach(function(pre) {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.innerHTML = '<i class="fas fa-copy"></i> Copy';
    wrapper.appendChild(button);
    
    button.addEventListener('click', function() {
      const code = pre.querySelector('code');
      const text = code ? code.textContent : pre.textContent;
      
      navigator.clipboard.writeText(text).then(function() {
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        
        setTimeout(function() {
          button.innerHTML = '<i class="fas fa-copy"></i> Copy';
          button.classList.remove('copied');
        }, 2000);
      });
    });
  });
  
  // Mobile menu toggle
  const mobileMenuToggle = document.createElement('button');
  mobileMenuToggle.className = 'mobile-menu-toggle';
  mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  
  const navbar = document.querySelector('.navbar .container');
  if (navbar) {
    navbar.appendChild(mobileMenuToggle);
    
    mobileMenuToggle.addEventListener('click', function() {
      const menu = document.querySelector('.navbar-menu');
      if (menu) {
        menu.classList.toggle('active');
        mobileMenuToggle.innerHTML = menu.classList.contains('active') ? 
          '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      }
    });
  }
});

// Add styles for TOC
const tocStyles = `
<style>
.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-sublist {
  list-style: none;
  padding-left: 1rem;
  margin: 0.25rem 0;
}

.toc-link {
  display: block;
  padding: 0.25rem 0.5rem;
  color: var(--gray);
  font-size: 0.875rem;
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.toc-link:hover {
  color: var(--primary);
  text-decoration: none;
  border-left-color: var(--primary);
}

.toc-link.active {
  color: var(--primary);
  font-weight: 500;
  border-left-color: var(--primary);
  background-color: rgba(0, 102, 204, 0.05);
}

.code-wrapper {
  position: relative;
  margin-bottom: var(--spacing-md);
}

.copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.copy-button.copied {
  background-color: var(--secondary);
  border-color: var(--secondary);
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--dark);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: block;
  }
  
  .navbar-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--white);
    border-top: 1px solid var(--border-color);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    padding: var(--spacing-md);
  }
  
  .navbar-menu.active {
    display: block;
  }
  
  .navbar-menu .navbar-item {
    display: block;
    padding: var(--spacing-sm) 0;
  }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', tocStyles);