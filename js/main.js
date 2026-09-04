let photosReady = false;
let photosLoaded = 0;
let animationPending = false;

function updatePhotoLoading() {
    const bar = document.getElementById('photo-progress-bar');
    const count = document.getElementById('photo-loading-count');
    const percent = Math.round((photosLoaded / totalUploadedPhotos) * 100);
    if (bar) bar.style.width = `${percent}%`;
    if (count) count.textContent = `照片准备中 ${photosLoaded} / ${totalUploadedPhotos}`;
}

function preloadAllPhotos() {
    const CONCURRENCY = 6;
    const finished = new Array(totalUploadedPhotos + 1).fill(false);
    let done = 0;
    let cursor = 1;
    const finish = (index) => {
        if (index >= 1 && index <= totalUploadedPhotos && !finished[index]) {
            finished[index] = true;
            done++;
            photosLoaded = done;
            updatePhotoLoading();
        }
        if (done >= totalUploadedPhotos) {
            photosReady = true;
            const status = document.getElementById('photo-loading-status');
            if (status) status.textContent = '照片准备完成';
            const screen = document.getElementById('photo-loading-screen');
            if (screen) screen.classList.add('hidden');
            onPhotosReady();
        }
    };
    const loadNext = () => {
        if (cursor > totalUploadedPhotos) return;
        const index = cursor++;
        const image = new Image();
        image.onload = () => { finish(index); loadNext(); };
        image.onerror = () => { finish(index); loadNext(); };
        image.src = `assets/images/${index}.webp`;
    };
    for (let i = 0; i < CONCURRENCY; i++) loadNext();
}

function onPhotosReady() {
    if (isFirstTime) return; // 首次访问：等用户点进入，再弹信
    startExperience();
}

function startExperience() {
    document.getElementById('main-ui').style.opacity = '1';
    document.getElementById('main-ui').style.pointerEvents = 'none';
    startQuotesCycle();
    if (isFirstTime && !window.forcedLetterShown) {
        window.forcedLetterShown = true;
        animationPending = true;
        showModal('letter-modal'); // 关信后自动播放爱心动画
    } else {
        enterAnimation();
    }
}

const btnLocation = document.getElementById('btn-location');
const btnEnter = document.getElementById('btn-enter');
const weatherText = document.getElementById('weather-text');
const welcomeScreen = document.getElementById('welcome-screen');
const mainUI = document.getElementById('main-ui');
let audio = document.getElementById('bgm');
// 进入网站立即开始播放音乐；受浏览器自动播放策略限制，先以静音模式启动，
// 用户第一次触摸屏幕时解除静音，声音无缝接上。
function tryStartMusic() {
    if (!audio) return;
    audio.play().catch(() => {});
}
audio.muted = true;
tryStartMusic();
document.addEventListener('pointerdown', () => { audio.muted = false; tryStartMusic(); }, { once: true, passive: true });
document.addEventListener('touchstart', () => { audio.muted = false; tryStartMusic(); }, { once: true, passive: true });

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
        audio.muted = false;
        audio.play().catch(e => console.log('Audio autoplay blocked:', e));
        if (photosReady) startExperience();
        else {
            const wait = setInterval(() => {
                if (photosReady) { clearInterval(wait); startExperience(); }
            }, 120);
        }
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
    void modal.offsetWidth;
    modal.classList.add('fade-in');
    if(id === 'letter-modal') startTypewriter();
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
function startTypewriter() {
    const box = document.getElementById('typewriter-content');
    if (!box) return;
    clearInterval(typewriterTimer);
    typeIndex = 0;
    box.classList.remove('done');
    box.textContent = '';
    const letterBody = document.querySelector('#letter-modal .letter-bg');
    typewriterTimer = setInterval(() => {
        typeIndex += 1;
        box.textContent = letterText.slice(0, typeIndex);
        if (letterBody) letterBody.scrollTop = letterBody.scrollHeight;
        if (typeIndex >= letterText.length) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
            box.classList.add('done');
        }
    }, 45);
}

let camera, sceneWebGL, sceneCSS, rendererWebGL, rendererCSS;
let controls;
const objects = [];
const targets = { heart: [], tree: [], ferris: [], galaxy: [], rose: [], firework: [], infinity: [], vortex: [] };

// 关键修改点：设定为 120 张
const photoCount = 120; 
const totalUploadedPhotos = 120; 

let particles;
let trunkBasePos, trunkTargetPos, trunkPoints, trunkTargetCol;
let ferrisBasePos, ferrisTargetPos, ferrisPoints, ferrisTargetCol;
const isFirstTime = !localStorage.getItem('universeVisited_v14');
const SHAPE_NAMES = [ 'heart', 'tree', 'ferris', 'galaxy', 'rose', 'firework', 'infinity', 'vortex' ];
let currentShapeIndex = 0;
let shapeBusy = false;

init();
preloadAllPhotos();
animate();

function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 2800; 
    
    sceneWebGL = new THREE.Scene();
    const particleCount = 3500;
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

    // 树干与树顶星粒子（切换圣诞树时汇聚成形，心形时散回星空）
    const trunkCount = 2100;
    trunkBasePos = new Float32Array(trunkCount * 3);
    trunkTargetPos = new Float32Array(trunkCount * 3);
    trunkTargetCol = new Float32Array(trunkCount * 3);
    let ti = 0;
    const putTrunkParticle = (x, y, z, r, g, b) => {
        trunkBasePos[ti*3] = (Math.random() - .5) * 5000;
        trunkBasePos[ti*3+1] = (Math.random() - .5) * 5000;
        trunkBasePos[ti*3+2] = (Math.random() - .5) * 5000;
        trunkTargetPos[ti*3] = x;
        trunkTargetPos[ti*3+1] = y;
        trunkTargetPos[ti*3+2] = z;
        trunkTargetCol[ti*3] = r; trunkTargetCol[ti*3+1] = g; trunkTargetCol[ti*3+2] = b;
        ti++;
    };
    // 树干：明显的高亮棕色柱体
    for (let k = 0; k < 800; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = 55 + Math.random() * 95;
        putTrunkParticle(Math.cos(a)*r, -1600 + Math.random()*1250, Math.sin(a)*r, .92, .68, .45);
    }
    // 树枝：从树干伸向每张照片（照片挂在枝头）
    for (let i = 0; i < 120; i++) {
        const t = i / 120;
        const angle = i * 2.39996;
        const r = 880 * (1 - t) + 130;
        const y = -380 + t * 1150;
        for (let s = 0; s < 10; s++) {
            const f = s / 9;
            const bx = Math.cos(angle) * (110 + (r - 110) * f);
            const by = (y - 40) + 40 * f;
            const bz = Math.sin(angle) * (110 + (r - 110) * f);
            putTrunkParticle(bx + (Math.random()-.5)*12, by + (Math.random()-.5)*12, bz + (Math.random()-.5)*12, .85, .6, .42);
        }
    }
    // 树顶星：金色光晕
    for (let k = 0; k < 100; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 140;
        putTrunkParticle(Math.cos(a)*r, 900 + Math.random()*150, Math.sin(a)*r, 1, .85, .4);
    }
    const trunkGeo = new THREE.BufferGeometry();
    const trunkInit = new Float32Array(trunkBasePos);
    trunkGeo.setAttribute('position', new THREE.BufferAttribute(trunkInit, 3));
    const trunkColInit = new Float32Array(trunkCount * 3);
    for (let i = 0; i < trunkCount * 3; i++) trunkColInit[i] = 1;
    trunkGeo.setAttribute('color', new THREE.BufferAttribute(trunkColInit, 3));
    trunkPoints = new THREE.Points(trunkGeo, new THREE.PointsMaterial({
        size: 55, map: texture, vertexColors: true, transparent: true, opacity: .95,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    sceneWebGL.add(trunkPoints);

    // 摩天轮骨架粒子：轮毂 + 轮辐 + 外圈圆环（XY 平面，绕 Z 轴滚动）
    const ferrisCount = 720;
    ferrisBasePos = new Float32Array(ferrisCount * 3);
    ferrisTargetPos = new Float32Array(ferrisCount * 3);
    ferrisTargetCol = new Float32Array(ferrisCount * 3);
    let fi = 0;
    const putFerris = (x, y, z, r, g, b) => {
        ferrisBasePos[fi*3] = (Math.random() - .5) * 5000;
        ferrisBasePos[fi*3+1] = (Math.random() - .5) * 5000;
        ferrisBasePos[fi*3+2] = (Math.random() - .5) * 5000;
        ferrisTargetPos[fi*3] = x;
        ferrisTargetPos[fi*3+1] = y;
        ferrisTargetPos[fi*3+2] = z;
        ferrisTargetCol[fi*3] = r; ferrisTargetCol[fi*3+1] = g; ferrisTargetCol[fi*3+2] = b;
        fi++;
    };
    // 轮毂（更亮更密）
    for (let k = 0; k < 80; k++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.random() * 130;
        putFerris(Math.cos(a)*rr, Math.sin(a)*rr, (Math.random()-.5)*20, 1, .97, .75);
    }
    // 轮辐：12 条从轮毂伸向外圈（更密）
    for (let spoke = 0; spoke < 12; spoke++) {
        const a = spoke * (Math.PI * 2 / 12);
        for (let s = 0; s < 20; s++) {
            const rr = 130 + s * 41;
            putFerris(Math.cos(a)*rr, Math.sin(a)*rr, (Math.random()-.5)*16, 1, .92, .68);
        }
    }
    // 外圈圆环（更亮更密）
    for (let k = 0; k < 400; k++) {
        const a = Math.random() * Math.PI * 2;
        putFerris(Math.cos(a)*950, Math.sin(a)*950, (Math.random()-.5)*22, 1, 1, .88);
    }
    const ferrisGeo = new THREE.BufferGeometry();
    const ferrisInit = new Float32Array(ferrisBasePos);
    ferrisGeo.setAttribute('position', new THREE.BufferAttribute(ferrisInit, 3));
    const ferrisColInit = new Float32Array(ferrisCount * 3);
    for (let i = 0; i < ferrisCount * 3; i++) ferrisColInit[i] = 1;
    ferrisGeo.setAttribute('color', new THREE.BufferAttribute(ferrisColInit, 3));
    ferrisPoints = new THREE.Points(ferrisGeo, new THREE.PointsMaterial({
        size: 62, map: texture, vertexColors: true, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    sceneWebGL.add(ferrisPoints);

    rendererWebGL = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    rendererWebGL.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('webgl-container').appendChild( rendererWebGL.domElement );

    sceneCSS = new THREE.Scene();

    for ( let i = 0; i < photoCount; i ++ ) {
        const element = document.createElement( 'div' );
        element.className = 'element';
        
        let imgIndex = (i % totalUploadedPhotos) + 1;
        element.style.backgroundImage = `url('assets/images/${imgIndex}.webp')`;
        
        let pointerDownPos = { x: 0, y: 0 };
        element.addEventListener('pointerdown', (e) => {
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });
        element.addEventListener('pointerup', (e) => {
            const dx = Math.abs(e.clientX - pointerDownPos.x);
            const dy = Math.abs(e.clientY - pointerDownPos.y);
            if (dx < 5 && dy < 5) {
                if (suppressPhotoClick) return;
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

    // 圣诞树：照片沿螺旋线一张一张挂在枝头，面向外侧
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = i / objects.length;
        const angle = i * 2.39996;
        const r = 880 * (1 - t) + 130;
        const y = -380 + t * 1150;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( angle ) * r, y, Math.sin( angle ) * r );
        object.lookAt( 0, y, 0 );
        targets.tree.push( object );
    }

    // 摩天轮：照片车仓沿垂直大圆环，面向圆心
    for ( let i = 0; i < objects.length; i ++ ) {
        const a = ( i / objects.length ) * Math.PI * 2;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * 950, Math.sin( a ) * 950, 0 );
        object.lookAt( 0, 0, 0 );
        targets.ferris.push( object );
    }

    // 玫瑰：五叶玫瑰曲线，照片沿花瓣
    for ( let i = 0; i < objects.length; i ++ ) {
        const theta = ( i / objects.length ) * Math.PI * 2;
        const rr = 820 * Math.abs( Math.cos( 5 * theta ) ) + 40;
        const object = new THREE.Object3D();
        object.position.set( rr * Math.cos( theta ), rr * Math.sin( theta ), ( Math.random() - .5 ) * 130 );
        object.lookAt( 0, 0, 0 );
        targets.rose.push( object );
    }

    // 烟花：十五条射线向外放射
    for ( let i = 0; i < objects.length; i ++ ) {
        const ray = i % 15;
        const idx = Math.floor( i / 15 );
        const a = ray * ( Math.PI * 2 / 15 );
        const r = 160 + idx * 95;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * r, Math.sin( a ) * r, ( Math.random() - .5 ) * 170 );
        object.lookAt( 0, 0, 0 );
        targets.firework.push( object );
    }

    // 银河：两条旋臂向外旋转展开
    for ( let i = 0; i < objects.length; i ++ ) {
        const arm = i % 2;
        const idx = Math.floor( i / 2 );
        const r = 200 + idx * 20;
        const a = idx * 0.22 + arm * Math.PI;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( a ) * r, ( Math.random() - .5 ) * 130, Math.sin( a ) * r );
        object.lookAt( 0, 0, 0 );
        targets.galaxy.push( object );
    }

    // 无限符号：伯努利双纽线
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = ( i / objects.length ) * Math.PI * 2 - Math.PI;
        const denom = 1 + Math.sin( t ) * Math.sin( t );
        const object = new THREE.Object3D();
        object.position.set( 820 * Math.cos( t ) / denom, 820 * Math.sin( t ) * Math.cos( t ) / denom, ( Math.random() - .5 ) * 150 );
        targets.infinity.push( object );
    }

    // 漩涡：漏斗状螺旋向下收拢
    for ( let i = 0; i < objects.length; i ++ ) {
        const t = i / objects.length;
        const angle = i * 0.5;
        const r = 1000 * (1 - t) + 80;
        const y = 780 * (1 - t) - 360;
        const object = new THREE.Object3D();
        object.position.set( Math.cos( angle ) * r, y, Math.sin( angle ) * r );
        object.lookAt( 0, y, 0 );
        targets.vortex.push( object );
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

}

function enterAnimation() {
    TWEEN.removeAll();
    const flyDuration = 1000;
    
    for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const targetHeart = targets.heart[i];
        
        obj.position.set(4000 + Math.random() * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
        obj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        const randomX = (Math.random() - 0.5) * 1500;
        const randomY = (Math.random() - 0.5) * 1500;
        const randomZ = (Math.random() - 0.5) * 1500;

        const delay1 = i * 20; 

        const tweenPos1 = new TWEEN.Tween(obj.position)
            .to({ x: randomX, y: randomY, z: randomZ }, flyDuration)
            .easing(TWEEN.Easing.Cubic.Out)
            .delay(delay1);

        const tweenRot1 = new TWEEN.Tween(obj.rotation)
            .to({ x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 }, flyDuration)
            .delay(delay1);

        const delay2 = 3200 + Math.random() * 800; 

        const tweenPos2 = new TWEEN.Tween(obj.position)
            .to({ x: targetHeart.position.x, y: targetHeart.position.y, z: targetHeart.position.z }, 2000)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay2);

        const tweenRot2 = new TWEEN.Tween(obj.rotation)
            .to({ x: targetHeart.rotation.x, y: targetHeart.rotation.y, z: targetHeart.rotation.z }, 2000)
            .easing(TWEEN.Easing.Exponential.InOut)
            .delay(delay2);

        tweenPos1.start();
        tweenRot1.start();
        tweenPos2.start();
        tweenRot2.start();
    }
    new TWEEN.Tween(this).to({}, 6000).onUpdate(render).start();
}

let trunkState = 0;
let ferrisState = 0;
function animateTrunk(toTree) {
    const target = toTree ? 1 : 0;
    if (trunkState === target) return;   // 状态未变化，不重复动画
    trunkState = target;
    const geo = trunkPoints.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const state = { p: target === 1 ? 0 : 1 };
    new TWEEN.Tween(state)
        .to({ p: target }, 1700)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
            const p = state.p;
            for (let i = 0; i < trunkBasePos.length; i++) {
                posAttr.array[i] = trunkBasePos[i] * (1 - p) + trunkTargetPos[i] * p;
            }
            posAttr.needsUpdate = true;
            for (let i = 0; i < trunkTargetCol.length; i++) {
                // 目标色（树干暖白 / 树顶金）与白色之间过渡
                colAttr.array[i] = 1 - (1 - trunkTargetCol[i]) * p;
            }
            colAttr.needsUpdate = true;
        })
        .start();
}
function animateFerris(toFerris) {
    const target = toFerris ? 1 : 0;
    if (ferrisState === target) return;
    ferrisState = target;
    const geo = ferrisPoints.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const state = { p: target === 1 ? 0 : 1 };
    new TWEEN.Tween(state)
        .to({ p: target }, 1600)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
            const p = state.p;
            for (let i = 0; i < ferrisBasePos.length; i++) {
                posAttr.array[i] = ferrisBasePos[i] * (1 - p) + ferrisTargetPos[i] * p;
            }
            posAttr.needsUpdate = true;
            for (let i = 0; i < ferrisTargetCol.length; i++) {
                colAttr.array[i] = 1 - (1 - ferrisTargetCol[i]) * p;
            }
            colAttr.needsUpdate = true;
        })
        .start();
}
function switchShape() {
    if (shapeBusy) return;
    shapeBusy = true;
    setTimeout(() => { shapeBusy = false; }, 2300);
    currentShapeIndex = ( currentShapeIndex + 1 ) % SHAPE_NAMES.length;
    const name = SHAPE_NAMES[ currentShapeIndex ];
    transform( targets[ name ], 1800 );
    if ( name === 'tree' ) { animateTrunk( true ); animateFerris( false ); }
    else if ( name === 'ferris' ) { animateTrunk( false ); animateFerris( true ); }
    else { animateTrunk( false ); animateFerris( false ); }
}
let lastTapTime = 0, lastTapX = 0, lastTapY = 0;
let suppressPhotoClick = false;
window.addEventListener('pointerdown', (e) => {
    const now = performance.now();
    const dx = Math.abs(e.clientX - lastTapX);
    const dy = Math.abs(e.clientY - lastTapY);
    if (now - lastTapTime < 350 && dx < 50 && dy < 50) {
        switchShape();
        suppressPhotoClick = true;
        setTimeout(() => { suppressPhotoClick = false; }, 450);
        lastTapTime = 0;
    } else {
        lastTapTime = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
    }
});

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
    if (SHAPE_NAMES[ currentShapeIndex ] === 'ferris' && !shapeBusy) {
        const d = 0.005;
        const c = Math.cos(d), s = Math.sin(d);
        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            const x = o.position.x, y = o.position.y;
            o.position.x = x * c - y * s;
            o.position.y = x * s + y * c;
            o.rotation.z += d;
        }
        ferrisPoints.rotation.z += d;
    }
    render();
}

function render() {
    rendererWebGL.render( sceneWebGL, camera );
    rendererCSS.render( sceneCSS, camera );
}

if (!isFirstTime) {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('main-ui').style.pointerEvents = 'none';
    // 老用户：图片加载完成后直接进入，不强制显示信件。
}