const controlsUI = document.getElementById('shape-controls');
let uiFadeTimeout;

function handlePointerMove(x, y) {
    if (document.getElementById('main-ui').style.opacity === '0') return;
    const isMobile = window.innerWidth <= 768;
    let isNear = isMobile ? (y > window.innerHeight * 0.55) : (x > window.innerWidth * 0.65);

    if (isNear) {
        controlsUI.classList.remove('hidden');
        clearTimeout(uiFadeTimeout);
        uiFadeTimeout = setTimeout(() => { controlsUI.classList.add('hidden'); }, 2500);
    } else {
        controlsUI.classList.add('hidden');
    }
}

window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
    if(e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true}); 

const btnLocation = document.getElementById('btn-location');
const btnEnter = document.getElementById('btn-enter');
const weatherText = document.getElementById('weather-text');
const welcomeScreen = document.getElementById('welcome-screen');
const mainUI = document.getElementById('main-ui');
let audio = document.getElementById('bgm');

// 先加载轻量预览图并显示进度；高清图在入场动画结束后替换。
const imageCache = new Map();
const photoElements = [];
const MAX_IMAGE_LOADS = 3;
let thumbsReady = false;
let fullLoadingStarted = false;
let thumbsLoaded = 0;
let weatherReady = false;

function setLoadingProgress() {
    const percent = Math.round((thumbsLoaded / totalUploadedPhotos) * 100);
    const bar = document.getElementById('photo-progress-bar');
    const count = document.getElementById('photo-loading-count');
    if (bar) bar.style.width = `${percent}%`;
    if (count) count.innerText = `预览照片准备中 ${thumbsLoaded} / ${totalUploadedPhotos}`;
}

function showEnterButtonWhenReady() {
    if (!weatherReady || !thumbsReady) return;
    const status = document.getElementById('photo-loading-status');
    if (status) status.innerText = '相册准备完成，可以进入啦 ✨';
    btnEnter.style.display = 'inline-block';
    btnEnter.disabled = false;
    btnEnter.innerText = '去看我给你准备的惊喜 🚀';
}

function hideLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    screen.classList.add('hidden');
}

function preloadPhotoThumbnails() {
    const startedAt = Date.now();
    setLoadingProgress();
    let next = 1;
    const worker = async () => {
        while (next <= totalUploadedPhotos) {
            const index = next++;
            await new Promise(resolve => {
                const image = new Image();
                image.onload = () => {
                    photoElements.forEach(item => {
                        if (item.index === index) item.element.style.backgroundImage = `url(\"assets/images/thumbs/${index}.webp\")`;
                    });
                    resolve();
                };
                image.onerror = resolve;
                image.src = `assets/images/thumbs/${index}.webp`;
            });
            thumbsLoaded++;
            setLoadingProgress();
        }
    };
    Promise.all(Array.from({length: MAX_IMAGE_LOADS}, worker)).then(() => {
        thumbsLoaded = totalUploadedPhotos;
        setLoadingProgress();
        thumbsReady = true;
        const elapsed = Date.now() - startedAt;
        // Keep the progress screen visible briefly, even on a warm cache.
        setTimeout(() => {
            hideLoadingScreen();
            showEnterButtonWhenReady();
        }, Math.max(450, 900 - elapsed));
    });
}

function loadFullPhoto(index) {
    if (imageCache.has(index)) return imageCache.get(index);
    const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
            const finish = () => {
                photoElements.forEach(item => {
                    if (item.index === index) item.element.style.backgroundImage = `url(\"assets/images/${index}.webp\")`;
                });
                resolve();
            };
            if (image.decode) image.decode().catch(() => {}).finally(finish);
            else finish();
        };
        image.onerror = reject;
        image.src = `assets/images/${index}.webp`;
    });
    imageCache.set(index, promise);
    return promise;
}

function startFullPhotoLoading() {
    if (fullLoadingStarted) return;
    fullLoadingStarted = true;
    let next = 1;
    const worker = async () => {
        while (next <= totalUploadedPhotos) {
            const index = next++;
            try { await loadFullPhoto(index); } catch (error) { console.warn(`照片 ${index} 加载失败`, error); }
        }
    };
    // Wait until the entrance animation has finished before decoding large images.
    setTimeout(() => Promise.all(Array.from({length: MAX_IMAGE_LOADS}, worker)), 7000);
}

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
            weatherReady = true;
            showEnterButtonWhenReady();
        }, (error) => {
            weatherText.innerHTML = "哎呀，没有拿到位置信息呢。<br>没关系，反正你在我心里~ 🌌";
            weatherReady = true;
            showEnterButtonWhenReady();
        });
    } else {
        weatherText.innerHTML = "设备不支持定位功能呢。<br>直接进来吧！";
        weatherReady = true;
            showEnterButtonWhenReady();
    }
});

let experienceStarted = false;
btnEnter.addEventListener('click', () => {
    if (experienceStarted || !thumbsReady) return;
    experienceStarted = true;
    welcomeScreen.style.opacity = '0';
    localStorage.setItem('universeVisited_v14', 'true');
    setTimeout(() => {
        welcomeScreen.style.display = 'none';
        mainUI.style.opacity = '1';
        mainUI.style.pointerEvents = 'none';
        audio.play().catch(e => console.log('Audio autoplay blocked:', e));
        enterAnimation();
        controlsUI.classList.remove('hidden');
        uiFadeTimeout = setTimeout(() => { controlsUI.classList.add('hidden'); }, 3000);
        startQuotesCycle();
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
const quotesBox = document.getElementById('quotes-box');

function startQuotesCycle() {
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
    modal.style.display = 'block'; 
    modal.classList.remove('fade-out');
    modal.classList.add('fade-in');
    
    if(id === 'letter-modal' && !window.typewriterStarted) {
        startTypewriter();
        window.typewriterStarted = true;
    }
}

function hideModal(id) { 
    const modal = document.getElementById(id);
    modal.classList.remove('fade-in');
    modal.classList.add('fade-out');
    setTimeout(() => {
        if(modal.classList.contains('fade-out')) {
            modal.style.display = 'none';
        }
    }, 300); 
}

const calendarGrid = document.getElementById('calendar-grid');
const memoryDisplay = document.getElementById('memory-display');
for(let i=1; i<=35; i++) {
    let div = document.createElement('div');
    div.className = 'day-cell';
    if(i <= 31) div.innerText = i;
    if(i === 7 || i === 14 || i === 25) {
        div.classList.add('active');
        div.onclick = () => {
            memoryDisplay.style.display = 'block';
            document.getElementById('m-date').innerText = `2026年某月${i}日`;
            document.getElementById('m-text').innerText = "不论天气如何变幻，那天你在身边，就是值得永远标记的日子。";
        };
    }
    calendarGrid.appendChild(div);
}

const letterText = "谢谢你来爱一个这么糟糕的我。\n\n我的情绪像天气总是飘忽不定，往往最伤人的话都对着你说。其实我也知道自己这么子做会让你我渐行渐远，但我还是会有点小任性。有时候我的一些小脾气，只是想让你在意我，更喜欢我。\n\n我知道自己很糟糕，脾气很奇怪也没有那么好看，你总说拥有我很幸福，其实是我有你好幸运。\n\n好幸运遇到了一个这么好的你。你总是很厉害，可以注意到我的坏情绪，老是想尽办法逗我开心。有的时候明明很不开心，你和我说话的时候，我就把烦恼抛之脑后了。谢谢你给了我足够的安全感，有你真的好幸福……\n\n生活是乱糟糟的，有你一切都都很安稳。我喜欢安稳的生活，爱吃的东西我会吃一辈子，喜欢听的歌我也会执着的听上千万遍。\n\n你也一样，我一旦依赖上一个人就再也不会放手啦。我要和你一辈子。";

let typeIndex = 0;
function startTypewriter() {
    const box = document.getElementById('typewriter-content');
    box.innerHTML = "";
    let timer = setInterval(() => {
        if(typeIndex < letterText.length) {
            let char = letterText.charAt(typeIndex);
            box.innerHTML += (char === '\n') ? '<br>' : char;
            typeIndex++;
            if(box.parentElement) {
                box.parentElement.scrollTop = box.parentElement.scrollHeight;
            }
        } else {
            clearInterval(timer);
            box.classList.add('done');
        }
    }, 120);
}

let camera, sceneWebGL, sceneCSS, rendererWebGL, rendererCSS;
let controls;
const objects = [];
const targets = { heart: [], sphere: [], helix: [], grid: [] };

// 关键修改点：设定为 120 张
const photoCount = 120; 
const totalUploadedPhotos = 120; 

let particles;

init();
preloadPhotoThumbnails();
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

    rendererWebGL = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio < 2
    });
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('webgl-container').appendChild( rendererWebGL.domElement );

    sceneCSS = new THREE.Scene();

    for ( let i = 0; i < photoCount; i ++ ) {
        const element = document.createElement( 'div' );
        element.className = 'element';
        
        let imgIndex = (i % totalUploadedPhotos) + 1;
        // 背景图不在初始化阶段加载，交给渐进式队列处理。
        element.dataset.imageIndex = imgIndex;
        element.style.backgroundColor = 'rgba(255, 140, 163, 0.08)';
        element.style.backgroundImage = `url('assets/images/thumbs/${imgIndex}.webp')`;
        photoElements.push({ element, index: imgIndex });
        
        let pointerDownPos = { x: 0, y: 0 };
        element.addEventListener('pointerdown', (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        element.addEventListener('pointerup', (e) => {
            const dx = Math.abs(e.clientX - pointerDownPos.x);
            const dy = Math.abs(e.clientY - pointerDownPos.y);
            if (dx < 5 && dy < 5) {
                const enlargedPhoto = document.getElementById('enlarged-photo');
                const currentImageIndex = Number(element.dataset.currentImageIndex || imgIndex);
                enlargedPhoto.src = `assets/images/${currentImageIndex}.webp`;
                showModal('photo-modal');
            }
        });

        const objectCSS = new THREE.CSS3DObject( element );
        objectCSS.element = element;
        objectCSS.position.x = 6000;
        objectCSS.position.y = 0;
        objectCSS.position.z = 0;
        sceneCSS.add( objectCSS );
        objects.push( objectCSS );
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

    const changeShape = (target) => { cancelBookEntrance(); transform(target, 1500); };
    document.getElementById('btn-heart').addEventListener('click', () => changeShape(targets.heart));
    document.getElementById('btn-sphere').addEventListener('click', () => changeShape(targets.sphere));
    document.getElementById('btn-helix').addEventListener('click', () => changeShape(targets.helix));
    document.getElementById('btn-grid').addEventListener('click', () => changeShape(targets.grid));
}

let activeBook = null;
let entranceCancelled = false;

function enterAnimation() {
    TWEEN.removeAll();
    entranceCancelled = false;
    const previousAutoRotate = controls.autoRotate;
    const previousEnabled = controls.enabled;
    const previousCameraPosition = camera.position.clone();
    const previousTarget = controls.target.clone();
    controls.autoRotate = false;
    controls.enabled = true;

    const pageCount = 6;
    const pageImages = Array.from({ length: pageCount }, (_, i) => `assets/images/${i + 1}.webp`);
    const isMobile = window.innerWidth <= 768;
    const pageWidth = isMobile ? 430 : 600;
    const pageHeight = isMobile ? 600 : 820;
    const book = new THREE.Group();
    book.position.set(0, 0, -120);
    book.rotation.set(THREE.MathUtils.degToRad(-8), THREE.MathUtils.degToRad(-5), 0);
    book.scale.set(.72, .72, .72);
    sceneCSS.add(book);
    activeBook = { book, previousAutoRotate, previousEnabled, previousCameraPosition, previousTarget };

    const makePanel = (className, width, height) => {
        const panel = document.createElement('div');
        panel.className = className;
        panel.style.width = `${width}px`;
        panel.style.height = `${height}px`;
        return panel;
    };
    const makePaperPage = (url, index) => {
        const hinge = new THREE.Object3D();
        hinge.position.set(0, 0, 30 - index * 3);
        const page = makePanel('true3d-paper-page', pageWidth, pageHeight);
        const front = makePanel('true3d-paper-face true3d-paper-front', pageWidth, pageHeight);
        const back = makePanel('true3d-paper-face true3d-paper-back', pageWidth, pageHeight);
        const frontImage = document.createElement('img');
        const backImage = document.createElement('img');
        frontImage.src = url;
        backImage.src = url;
        frontImage.alt = `我们的回忆 ${index + 1}`;
        backImage.alt = `我们的回忆 ${index + 1}`;
        frontImage.draggable = false;
        backImage.draggable = false;
        front.appendChild(frontImage);
        back.appendChild(backImage);
        page.appendChild(front);
        page.appendChild(back);
        const cssPage = new THREE.CSS3DObject(page);
        cssPage.position.set(pageWidth / 2, 0, 0);
        hinge.add(cssPage);
        book.add(hinge);
        return { hinge, page, front, back };
    };

    const leftBase = new THREE.CSS3DObject(makePanel('true3d-book-base true3d-book-base-left', pageWidth, pageHeight));
    leftBase.position.set(-pageWidth / 2, 0, -25);
    book.add(leftBase);
    const rightBase = new THREE.CSS3DObject(makePanel('true3d-book-base true3d-book-base-right', pageWidth, pageHeight));
    rightBase.position.set(pageWidth / 2, 0, -25);
    book.add(rightBase);
    const spine = new THREE.CSS3DObject(makePanel('true3d-book-spine', 14, pageHeight + 40));
    spine.position.set(0, 0, 45);
    book.add(spine);
    const leftCover = new THREE.CSS3DObject(makePanel('true3d-book-cover true3d-book-cover-left', pageWidth, pageHeight));
    leftCover.position.set(-pageWidth / 2, 0, 40);
    book.add(leftCover);
    const coverHinge = new THREE.Object3D();
    coverHinge.position.set(0, 0, 48);
    const rightCover = new THREE.CSS3DObject(makePanel('true3d-book-cover true3d-book-cover-right', pageWidth, pageHeight));
    rightCover.position.set(pageWidth / 2, 0, 0);
    coverHinge.add(rightCover);
    book.add(coverHinge);
    const pages = pageImages.map(makePaperPage);

    function preloadBookImage(url, attempt = 0) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = 'async';
            image.onload = () => {
                const done = () => resolve(image);
                if (image.decode) image.decode().catch(() => {}).finally(done);
                else done();
            };
            image.onerror = () => {
                if (attempt < 2) setTimeout(() => preloadBookImage(url, attempt + 1).then(resolve).catch(reject), 180);
                else reject(new Error(`无法加载书页照片 ${url}`));
            };
            image.src = url;
        });
    }

    Promise.all(pageImages.map(preloadBookImage)).then(() => {
        if (entranceCancelled || !activeBook || activeBook.book !== book) return;
        book.visible = true;
        new TWEEN.Tween(book.scale).to({ x: 1, y: 1, z: 1 }, 800).easing(TWEEN.Easing.Cubic.Out).start();
        new TWEEN.Tween(book.rotation).to({ x: THREE.MathUtils.degToRad(-4), y: 0, z: 0 }, 800).easing(TWEEN.Easing.Cubic.Out).start();
        new TWEEN.Tween(coverHinge.rotation).to({ y: -Math.PI * .88 }, 900).delay(500).easing(TWEEN.Easing.Cubic.InOut).start();
        pages.forEach((item, index) => {
            item.page.style.zIndex = String(pageCount - index + 20);
        });
        flipPagesOneByOne(pages, 0, book, previousAutoRotate);
    }).catch(error => {
        console.warn('书页预加载失败，取消开场动画', error);
        finishBookEntrance(activeBook);
        launchHeartFromBook(previousAutoRotate, null);
    });
}

function flipPagesOneByOne(pages, index, book, previousAutoRotate) {
    if (entranceCancelled || !activeBook || activeBook.book !== book) return;
    if (index >= pages.length) {
        setTimeout(() => {
            if (entranceCancelled || !activeBook || activeBook.book !== book) return;
            const state = activeBook;
            const cameraStart = camera.position.clone();
            new TWEEN.Tween(camera.position).to({ x: 0, y: 0, z: 560 }, 1000).easing(TWEEN.Easing.Cubic.InOut).start();
            new TWEEN.Tween(book.scale).to({ x: 2.8, y: 2.8, z: 2.8 }, 1000).easing(TWEEN.Easing.Cubic.InOut).start();
            setTimeout(() => {
                if (entranceCancelled || !activeBook || activeBook.book !== book) return;
                finishBookEntrance(state);
                launchHeartFromBook(previousAutoRotate, null);
            }, 1250);
        }, 450);
        return;
    }
    const page = pages[index];
    const flipState = { angle: 0 };
    new TWEEN.Tween(flipState)
        .to({ angle: -Math.PI }, 720)
        .delay(index === 0 ? 450 : 80)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
            page.hinge.rotation.y = flipState.angle;
            // 翻完的页面退到书页底部，下一张照片不会被遮住。
            if (flipState.angle < -Math.PI * .55) page.page.style.zIndex = String(5 + index);
        })
        .onComplete(() => {
            page.hinge.rotation.y = -Math.PI;
            flipPagesOneByOne(pages, index + 1, book, previousAutoRotate);
        })
        .start();
}

function finishBookEntrance(bookState) {
    if (!bookState) return;
    entranceCancelled = true;
    TWEEN.removeAll();
    bookState.book.visible = false;
    sceneCSS.remove(bookState.book);
    camera.position.copy(bookState.previousCameraPosition);
    controls.target.copy(bookState.previousTarget);
    controls.enabled = bookState.previousEnabled;
    controls.autoRotate = bookState.previousAutoRotate;
    controls.update();
    rendererCSS.render(sceneCSS, camera);
    activeBook = null;
}

function cancelBookEntrance() {
    if (!activeBook) return false;
    finishBookEntrance(activeBook);
    objects.forEach(object => { object.visible = true; });
    return true;
}

function launchHeartFromBook(previousAutoRotate, unusedBookStage) {
    TWEEN.removeAll();
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const distance = 3000 + Math.random() * 1600;
        const side = i % 4;
        object.visible = true;
        object.element.style.width = '90px';
        object.element.style.height = '120px';
        object.element.style.willChange = 'transform';
        if (side === 0) object.position.set(-distance, (Math.random() - .5) * 2600, (Math.random() - .5) * 1600);
        if (side === 1) object.position.set(distance, (Math.random() - .5) * 2600, (Math.random() - .5) * 1600);
        if (side === 2) object.position.set((Math.random() - .5) * 3600, distance * .55, (Math.random() - .5) * 1600);
        if (side === 3) object.position.set((Math.random() - .5) * 3600, -distance * .55, (Math.random() - .5) * 1600);
        object.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        object.scale.set(.72, .72, .72);
    }
    transform(targets.heart, 2200);
    setTimeout(() => {
        objects.forEach(object => { object.element.style.willChange = 'auto'; });
        controls.autoRotate = previousAutoRotate;
        controls.enabled = true;
        startFullPhotoLoading();
    }, 2600);
}

function transform( targets, duration ) {
    TWEEN.removeAll();
    for ( let i = 0; i < objects.length; i ++ ) {
        const object = objects[ i ];
        const target = targets[ i ];
        object.visible = true;

        new TWEEN.Tween( object.position )
            .to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        new TWEEN.Tween( object.rotation )
            .to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();

        new TWEEN.Tween( object.scale )
            .to( { x: 1, y: 1, z: 1 }, Math.random() * duration + duration )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    rendererCSS.setSize( window.innerWidth, window.innerHeight );
    render();
}

function animate(now = 0) {
    requestAnimationFrame(animate);
    TWEEN.update();
    if (particles) {
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0004;
    }
    controls.update();
    rendererWebGL.render(sceneWebGL, camera);
    rendererCSS.render(sceneCSS, camera);
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
        
        const waitForThumbs = () => {
            if (!thumbsReady) return setTimeout(waitForThumbs, 50);
            requestAnimationFrame(() => {
                document.getElementById('main-ui').style.opacity = '1';
                enterAnimation();
                startQuotesCycle();
            });
        };
        waitForThumbs();

        const audioTip = document.createElement('div');
        audioTip.innerText = "点击屏幕播放我们的回忆原声 ✨";
        audioTip.style.cssText = "position:absolute; top:20%; left:50%; transform:translateX(-50%); z-index:100; color:#ff8ca3; font-family:'ZCOOL KuaiLe', sans-serif; font-size:16px; text-shadow:0 2px 5px rgba(0,0,0,0.5); pointer-events:none; animation: blink 2s infinite;";
        document.body.appendChild(audioTip);

        const playMusicOnTouch = () => {
            audio.play().catch(e => console.log(e));
            if(audioTip) audioTip.remove();
            document.removeEventListener('click', playMusicOnTouch);
            document.removeEventListener('touchstart', playMusicOnTouch);
        };
        document.addEventListener('click', playMusicOnTouch);
        document.addEventListener('touchstart', playMusicOnTouch, {passive:true});
        
        controlsUI.classList.remove('hidden');
        uiFadeTimeout = setTimeout(() => { controlsUI.classList.add('hidden'); }, 3000);
    }, 100);
}