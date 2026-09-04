const controlsUI = document.getElementById('shape-controls');
let uiFadeTimeout;
function initShapeControls() {
    shapeToggle = document.getElementById('shape-toggle');
    shapeButtonsContainer = document.getElementById('shape-buttons');
    shapeButtons = Array.from(document.querySelectorAll('.shape-btn'));
    if (shapeToggle && shapeButtonsContainer) {
        shapeToggle.addEventListener('click', () => {
            controlsUI.classList.toggle('open');
            shapeToggle.classList.toggle('open', controlsUI.classList.contains('open'));
        });
    }
}

let shapeToggle = null;
let shapeButtons = null;
let shapeButtonsContainer = null;
function handlePointerMove(x, y) {
    if (!shapeToggle || !shapeButtonsContainer) return;
    if (document.getElementById('main-ui').style.opacity === '0') return;
    const isMobile = window.innerWidth <= 768;
    const isNear = isMobile ? (y > window.innerHeight * 0.55) : (x > window.innerWidth * 0.6);
    shapeToggle.classList.toggle('visible', isNear && !shapeButtonsContainer.classList.contains('open'));
    // Magnify the button under the pointer during touch drag.
    if (isMobile && shapeButtonsContainer.classList.contains('open')) {
        shapeButtons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            const within = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            btn.classList.toggle('hovered', within);
        });
    }
}

window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true});
window.addEventListener('touchstart', (e) => {
    if(e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true}); 

const btnLocation = document.getElementById('btn-location');
const btnEnter = document.getElementById('btn-enter');
const weatherText = document.getElementById('weather-text');
const welcomeScreen = document.getElementById('welcome-screen');
const mainUI = document.getElementById('main-ui');
let audio = document.getElementById('bgm');
let photosReady = false;
let photosLoaded = 0;

function updatePhotoLoading() {
    const bar = document.getElementById('photo-progress-bar');
    const count = document.getElementById('photo-loading-count');
    const percent = Math.round((photosLoaded / totalUploadedPhotos) * 100);
    if (bar) bar.style.width = `${percent}%`;
    if (count) count.textContent = `照片准备中 ${photosLoaded} / ${totalUploadedPhotos}`;
}

function preloadAllPhotos() {
    const imageUrls = [];
    for (let index = 1; index <= totalUploadedPhotos; index++) {
        imageUrls.push(`assets/images/${index}.webp`);
    }
    const loaded = new Array(totalUploadedPhotos).fill(false);
    let completed = 0;
    const startLoader = (url) => {
        const image = new Image();
        image.onload = () => finish(url);
        image.onerror = () => finish(url);
        image.src = url;
    };
    const finish = (url) => {
        const index = imageUrls.indexOf(url);
        if (index >= 0 && !loaded[index]) {
            loaded[index] = true;
            completed++;
            photosLoaded = completed;
            updatePhotoLoading();
        }
        if (completed >= totalUploadedPhotos) {
            photosReady = true;
            const status = document.getElementById('photo-loading-status');
            if (status) status.textContent = '照片准备完成';
            const screen = document.getElementById('photo-loading-screen');
            if (screen) screen.classList.add('hidden');
            autoOpenLetter();
        }
    };
    // 并发限制为 6，进度仍然按完成数量递增，避免全部图片同时抢占网络。
    const CONCURRENCY = 6;
    let cursor = 0;
    const next = () => {
        if (cursor >= imageUrls.length) return;
        const url = imageUrls[cursor++];
        const image = new Image();
        image.onload = () => { finish(url); next(); };
        image.onerror = () => { finish(url); next(); };
        image.src = url;
    };
    for (let i = 0; i < Math.min(CONCURRENCY, imageUrls.length); i++) next();
}

function tryStartMusic() {
    if (!audio) return;
    audio.play().catch(() => {});
}
tryStartMusic();
document.addEventListener('pointerdown', tryStartMusic, { once: true, passive: true });
document.addEventListener('touchstart', tryStartMusic, { once: true, passive: true });

btnLocation.addEventListener('click', () => {
    weatherText.innerHTML = "正在感应你的位置... 🛰️";
    btnLocation.style.display = 'none';

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await response.json();
                const temp = data.current_weather.temperature;
                const code = data.current_weather.weathercode;
                
                let weatherStr = "晴朗";
                let tips = "今天天气真好，想不想我呀？☀️";
                if(code >= 1 && code <= 3) { weatherStr = "多云"; tips = "云朵有点多，但也挡不住好心情~ ⛅"; }
                if(code >= 45 && code <= 48) { weatherStr = "雾"; tips = "雾蒙蒙的，出门要注意安全哦~ 🌫️"; }
                if(code >= 51 && code <= 67) { weatherStr = "雨"; tips = "今天下雨啦，出门记得带伞，别淋湿了我的宝贝 🌧️"; }
                if(code >= 71 && code <= 82) { weatherStr = "雪"; tips = "下雪了！记得穿暖和点，想要一个拥抱吗？❄️"; }

                weatherText.innerHTML = `抓到你了！<br>你那里现在 ${temp}℃，天气${weatherStr}。<br><br><span style="color:#ff8ca3; font-size:18px;">${tips}</span>`;
            } catch (err) {
                weatherText.innerHTML = "网络好像有点小调皮。<br>不过没关系，有我的每一天都是好天气！☀️";
            }
            btnEnter.style.display = 'inline-block';
        }, (error) => {
            weatherText.innerHTML = "哎呀，没有拿到位置信息呢。<br>没关系，反正你在我心里~ 🌌";
            btnEnter.style.display = 'inline-block';
        });
    } else {
        weatherText.innerHTML = "设备不支持定位功能呢。<br>直接进来吧！";
        btnEnter.style.display = 'inline-block';
    }
});

btnEnter.addEventListener('click', () => {
    welcomeScreen.style.opacity = '0';
    localStorage.setItem('universeVisited_v14', 'true');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        mainUI.style.opacity = '1';
        mainUI.style.pointerEvents = 'none';
        
        audio.play().catch(e => console.log('Audio autoplay blocked:', e));
        startAnimationWhenReady();

        controlsUI.classList.remove('hidden');
        
        startQuotesCycle();
        autoOpenLetter();
    }, 1000);
});

const startDate = new Date('2026-08-07T00:00:00').getTime();
setInterval(() => {
    const diff = new Date().getTime() - startDate;
    document.getElementById('t-days').innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('t-hours').innerText = Math.floor((diff / (1000 * 60 * 60)) % 24);
    document.getElementById('t-mins').innerText = Math.floor((diff / 1000 / 60) % 60);
    document.getElementById('t-secs').innerText = Math.floor((diff / 1000) % 60);
}, 1000);

const hotQuotes = [
    "茉莉雪季的尾调是你浅淡的瞳色",
    "我当然不会怪你的敏感，你怎么样都可爱，是我做得不够好",
    "我想你一直这么天真",
    "我在一万顆星星中找到了你",
    "为你，甘之如饴，不管东南西北",
    "有你的话，我期待每一个明天",
    "谢谢你，被你喜欢和喜欢你都好幸福",
    "如果我的存在能让你开心，那我便一直在",
    "因为你，我第一次想成为更好的人",
    "世界送我的第二个太阳",
    "她说她一直都很坏，可是我爱她，她真的好可爱",
    "直到有一天，我的实况出现你的声音",
    "今年冬天格外冷，庆幸你比冬天先来",
    "许你一生無憂，願你一生平安"
];

let quoteIndex = 0;
let quotesCycleStarted = false;
const quotesBox = document.getElementById('quotes-box');

function startQuotesCycle() {
    if (quotesCycleStarted) return;
    quotesCycleStarted = true;
    quotesBox.innerText = hotQuotes[quoteIndex];
    setInterval(() => {
        quotesBox.classList.add('quotes-fade-out');
        quotesBox.classList.remove('quotes-fade-in');
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % hotQuotes.length;
            quotesBox.innerText = hotQuotes[quoteIndex];
            quotesBox.classList.remove('quotes-fade-out');
            quotesBox.classList.add('quotes-fade-in');
        }, 800); 
    }, 6000); 
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'block';
    modal.classList.remove('fade-out');
    void modal.offsetWidth;
    modal.classList.add('fade-in');
    if (id === 'letter-modal') {
        startTypewriter();
    }
}

let letterShouldOpen = false;
let animationPending = false;
function startAnimationWhenReady() {
    animationPending = true;
}
function openLetterWhenReady() {
    letterShouldOpen = true;
    const tryOpen = () => {
        if (!photosReady) {
            setTimeout(tryOpen, 80);
            return;
        }
        const screen = document.getElementById('photo-loading-screen');
        if (screen && !screen.classList.contains('hidden')) {
            setTimeout(tryOpen, 80);
            return;
        }
        if (letterShouldOpen) {
            letterShouldOpen = false;
            requestAnimationFrame(() => showModal('letter-modal'));
        }
    };
    tryOpen();
}
let letterAutoOpened = false;
function autoOpenLetter() {
    if (letterAutoOpened) return;
    letterAutoOpened = true;
    openLetterWhenReady();
}

function hideModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('fade-in');
    modal.classList.add('fade-out');
    setTimeout(() => {
        if(modal.classList.contains('fade-out')) {
            modal.style.display = 'none';
        }
        if (id === 'letter-modal' && animationPending) {
            animationPending = false;
            requestAnimationFrame(enterAnimation);
        }
    }, 300); 
}

const letterText = "谢谢你来爱一个这么糟糕的我。\n\n我的情绪像天气总是飘忽不定，往往最伤人的话都对着你说。其实我也知道自己这么子做会让你我渐行渐远，但我还是会有点小任性。有时候我的一些小脾气，只是想让你在意我，更喜欢我。\n\n我知道自己很糟糕，脾气很奇怪也没有那么好看，你总说拥有我很幸福，其实是我有你好幸运。\n\n好幸运遇到了一个这么好的你。你总是很厉害，可以注意到我的坏情绪，老是想尽办法逗我开心。有的时候明明很不开心，你和我说话的时候，我就把烦恼抛之脑后了。谢谢你给了我足够的安全感，有你真的好幸福……\n\n生活是乱糟糟的，有你一切都都很安稳。我喜欢安稳的生活，爱吃的东西我会吃一辈子，喜欢听的歌我也会执着的听上千万遍。\n\n你也一样，我一旦依赖上一个人就再也不会放手啦。我要和你一辈子。";

let typeIndex = 0;
let typewriterTimer = null;
let typewriterFrame = null;
function startTypewriter() {
    const box = document.getElementById('typewriter-content');
    if (!box) return;
    clearInterval(typewriterTimer);
    if (typewriterFrame) cancelAnimationFrame(typewriterFrame);
    typeIndex = 0;
    box.classList.remove('done');
    box.textContent = '';
    typewriterTimer = setInterval(() => {
        typeIndex += 1;
        if (!typewriterFrame) {
            typewriterFrame = requestAnimationFrame(() => {
                box.textContent = letterText.slice(0, typeIndex);
                const letterBody = document.querySelector('#letter-modal .letter-bg');
                if (letterBody) letterBody.scrollTop = letterBody.scrollHeight;
                typewriterFrame = null;
            });
        }
        if (typeIndex >= letterText.length) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
            if (typewriterFrame) cancelAnimationFrame(typewriterFrame);
            box.textContent = letterText;
            box.classList.add('done');
        }
    }, 55);
}

let camera, sceneWebGL, sceneCSS, rendererWebGL, rendererCSS;
let controls;
const objects = [];
const targets = { heart: [], sphere: [], helix: [], grid: [] };

// 关键修改点：设定为 120 张
const photoCount = 120; 
const totalUploadedPhotos = 120; 

let particles;

initShapeControls();
init();
preloadAllPhotos();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 2800; 
    
    sceneWebGL = new THREE.Scene();
    const particleCount = window.innerWidth <= 768 ? 1400 : 2400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i++) {
        positions[i] = (Math.random() - 0.5) * 5000;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 182, 193, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const pMaterial = new THREE.PointsMaterial({
        size: 45, 
        map: texture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    particles = new THREE.Points(geometry, pMaterial);
    sceneWebGL.add(particles);

    rendererWebGL = new THREE.WebGLRenderer({ alpha: true, antialias: window.devicePixelRatio < 2 });
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('webgl-container').appendChild( rendererWebGL.domElement );

    sceneCSS = new THREE.Scene();

    for ( let i = 0; i < photoCount; i ++ ) {
        const element = document.createElement( 'div' );
        element.className = 'element';
        
        let imgIndex = (i % totalUploadedPhotos) + 1;
        element.style.backgroundImage = `url('assets/images/tiny/${imgIndex}.webp')`;
        
        let pointerDownPos = { x: 0, y: 0 };
        element.addEventListener('pointerdown', (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        element.addEventListener('pointerup', (e) => {
            const dx = Math.abs(e.clientX - pointerDownPos.x);
            const dy = Math.abs(e.clientY - pointerDownPos.y);
            if (dx < 5 && dy < 5) {
                document.getElementById('enlarged-photo').src = `assets/images/${imgIndex}.webp`;
                showModal('photo-modal');
            }
        });

        const objectCSS = new THREE.CSS3DObject( element );
        objectCSS.position.x = 6000;
        objectCSS.position.y = 0;
        objectCSS.position.z = 0;
        sceneCSS.add( objectCSS );
        objects.push( objectCSS );

        // 背面面板：与正面共享同一照片，绕 Y 轴旋转 180 度，爱心旋转时背面不再空白。
        const backElement = document.createElement( 'div' );
        backElement.className = 'element element-back';
        backElement.style.backgroundImage = `url('assets/images/tiny/${imgIndex}.webp')`;
        const backCSS = new THREE.CSS3DObject( backElement );
        backCSS.rotation.y = Math.PI;
        objectCSS.add( backCSS );
        objectCSS.userData.backElement = backElement;
    }

    const scale = 45; 
    for ( let i = 0; i < objects.length; i ++ ) {
        let t = (i / objects.length) * Math.PI * 2;
        let x = 16 * Math.pow(Math.sin(t), 3) * scale;
        let y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
        
        const object = new THREE.Object3D();
        object.position.x = x;
        object.position.y = y + 150;
        object.position.z = (Math.random() - 0.5) * 400; 
        targets.heart.push( object );
    }

    const vector = new THREE.Vector3();
    for ( let i = 0, l = objects.length; i < l; i ++ ) {
        const phi = Math.acos( - 1 + ( 2 * i ) / l );
        const theta = Math.sqrt( l * Math.PI ) * phi;
        const object = new THREE.Object3D();
        object.position.setFromSphericalCoords( 900, phi, theta );
        vector.copy( object.position ).multiplyScalar( 2 );
        object.lookAt( vector );
        targets.sphere.push( object );
    }

    for ( let i = 0, l = objects.length; i < l; i ++ ) {
        const theta = i * 0.25 + Math.PI;
        const y = - ( i * 15 ) + 900; 
        const object = new THREE.Object3D();
        object.position.setFromCylindricalCoords( 900, theta, y );
        vector.x = object.position.x * 2;
        vector.y = object.position.y;
        vector.z = object.position.z * 2;
        object.lookAt( vector );
        targets.helix.push( object );
    }

    for ( let i = 0; i < objects.length; i ++ ) {
        const object = new THREE.Object3D();
        object.position.x = ( ( i % 6 ) * 250 ) - 600;
        object.position.y = ( - ( Math.floor( i / 6 ) % 5 ) * 250 ) + 500;
        object.position.z = ( Math.floor( i / 30 ) ) * 500 - 1000;
        targets.grid.push( object );
    }

    rendererCSS = new THREE.CSS3DRenderer();
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    rendererCSS.domElement.style.position = 'absolute';
    rendererCSS.domElement.style.top = 0;
    document.getElementById( 'css-container' ).appendChild( rendererCSS.domElement );

    controls = new THREE.OrbitControls( camera, rendererCSS.domElement );
    controls.minDistance = 500;
    controls.maxDistance = 8000;
    controls.enablePan = true; 
    controls.enableZoom = true; 
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    window.addEventListener( 'resize', onWindowResize );

    document.getElementById('btn-heart').addEventListener('click', () => transform(targets.heart, 1500));
    document.getElementById('btn-sphere').addEventListener('click', () => transform(targets.sphere, 1500));
    document.getElementById('btn-helix').addEventListener('click', () => transform(targets.helix, 1500));
    document.getElementById('btn-grid').addEventListener('click', () => transform(targets.grid, 1500));
}

let thumbPreloadDone = false;
function preloadThumbs() {
    const jobs = [];
    for (let index = 1; index <= totalUploadedPhotos; index++) {
        jobs.push(new Promise(resolve => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = resolve;
            image.src = `assets/images/thumbs/${index}.webp`;
        }));
    }
    Promise.all(jobs).then(() => { thumbPreloadDone = true; });
}

function enterAnimation() {
    TWEEN.removeAll();
    const duration = 2000;
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targets.heart[i];
        object.visible = true;
        object.scale.set(0.2, 0.2, 0.2);
        const imgIndex = (i % totalUploadedPhotos) + 1;
        // 入场阶段先显示轻量预览图，避免大量高清图解码造成卡顿。
        object.element.style.backgroundImage = `url('assets/images/tiny/${imgIndex}.webp')`;
        if (object.userData.backElement) object.userData.backElement.style.backgroundImage = `url('assets/images/tiny/${imgIndex}.webp')`;
        // 从外圈螺旋进入：半径随进度缩小，同时自转，最后停在心形目标上。
        const angle = Math.random() * Math.PI * 2;
        const radius = 5000 + Math.random() * 2500;
        object.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 2600,
            Math.sin(angle) * radius
        );
        object.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI);
        const delay = (i % 40) * 18 + Math.random() * 120;
        new TWEEN.Tween(object.position)
            .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay)
            .start();
        new TWEEN.Tween(object.rotation)
            .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay)
            .start();
        new TWEEN.Tween(object.scale)
            .to({ x: 1, y: 1, z: 1 }, duration)
            .easing(TWEEN.Easing.Back.Out)
            .delay(delay)
            .start();
    }
    // 动画结束后，把所有卡片换成高清原图。
    const swapDelay = duration + 1200;
    setTimeout(() => {
        for (let i = 0; i < objects.length; i++) {
            const imgIndex = (i % totalUploadedPhotos) + 1;
            objects[i].element.style.backgroundImage = `url('assets/images/${imgIndex}.webp')`;
            if (objects[i].userData.backElement) objects[i].userData.backElement.style.backgroundImage = `url('assets/images/${imgIndex}.webp')`;
        }
    }, swapDelay);
}

preloadThumbs();

function transform( targets, duration ) {
    TWEEN.removeAll();
    for ( let i = 0; i < objects.length; i ++ ) {
        const object = objects[ i ];
        const target = targets[ i ];

        new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    }
    new TWEEN.Tween( this ).to( {}, duration * 2 ).onUpdate( render ).start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate() {
    requestAnimationFrame( animate );
    TWEEN.update();
    
    if (particles) {
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0004;
    }
    
    controls.update(); 
    render();
}

function render() {
    rendererWebGL.render( sceneWebGL, camera );
    rendererCSS.render( sceneCSS, camera );
}

const isFirstTime = !localStorage.getItem('universeVisited_v14');

if (!isFirstTime) {
    document.getElementById('welcome-screen').style.display = 'none';
    
    setTimeout(() => {
        document.getElementById('main-ui').style.opacity = '1';
        document.getElementById('main-ui').style.pointerEvents = 'none';
        
        startAnimationWhenReady();
        startQuotesCycle();
        autoOpenLetter();

        controlsUI.classList.remove('hidden');
        
    }, 100);
}