// Shared customer bottom navigation
(function(){
  function renderBottomNav(active){
    if(document.getElementById('customerBottomNav')) return;
    const nav=document.createElement('nav');
    nav.id='customerBottomNav';
    nav.className='customer-bottom-nav';
    nav.innerHTML=`
      <a class="bottom-nav-item ${active==='home'?'active':''}" href="index.html">
        <span>⌂</span><small>Home</small>
      </a>
      <a class="bottom-nav-item ${active==='category'?'active':''}" href="category.html">
        <span>▦</span><small>Category</small>
      </a>
      <a class="bottom-nav-item ${active==='combo'?'active':''}" href="combo.html">
        <span>🎁</span><small>Combo</small>
      </a>
      <a class="bottom-nav-item ${active==='user'?'active':''}" href="user.html">
        <span>👤</span><small>User</small>
      </a>`;
    document.body.appendChild(nav);
  }
  window.renderBottomNav=renderBottomNav;
})();
