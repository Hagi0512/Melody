// 全局音频对象
const audio = new Audio();
let currentSong = null;
let currentSongIndex = 0;
let songs = [];
let isPlaying = false;
let volume = 0.7;
audio.volume = volume;

// 喜欢的歌分页相关变量
let currentPage = 1;
const songsPerPage = 5; // 每页显示的歌曲数量
let totalSongs = 0;      // 总歌曲数
let totalPages = 1;      // 总页数

// 搜索分页相关变量 (新增)
let searchCurrentPage = 1;
const searchPageSize = 20; // 每页显示的结果数
let searchTotalResults = 0;
let searchTotalPages = 1;
let currentQuery = '';

//  保存原始状态
let originalState = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    document.getElementById('username-placeholder').textContent = userData.username;

    // 初始化
    loadMyPlaylists(userData);
    loadLikedSongs(userData, currentPage);
    loadRecentlyPlayed(userData);

    // 初始化音频源
    audio.src = '';

    // 事件监听
    setupEventListeners();

    saveOriginalState();
});

// 保存原始状态
function saveOriginalState() {
    const container = document.querySelector('.container');
    originalState = container.innerHTML;
}

// 设置事件监听器
function setupEventListeners() {
    // 导航菜单
    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('active');
    });

    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            showNotification('已切换到暗色模式');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            showNotification('已切换到亮色模式');
        }
    });

    // 头像下拉菜单
    document.getElementById('userAvatar').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.querySelector('.dropdown-menu');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // 退出登录
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('您已退出登录');
        document.querySelector('.dropdown-menu').style.display = 'none';
        window.location.href = 'login.html';
    });

    // 关闭下拉菜单（点击页面其他地方）
    document.addEventListener('click', function(e) {
        const dropdown = document.querySelector('.dropdown-menu');
        if (!e.target.closest('.user-avatar') && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    });

    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);

    // 上一曲/下一曲按钮
    document.getElementById('prevBtn').addEventListener('click', playPrev);
    document.getElementById('nextBtn').addEventListener('click', playNext);

    // 互斥控制函数
    function toggleExclusive(activeBtn, inactiveBtn, modeName) {
        const wasActive = activeBtn.classList.contains('active');

        // 重置所有状态
        activeBtn.classList.remove('active');
        inactiveBtn.classList.remove('active');
        audio.loop = false;

        // 如果是新激活（之前未激活）
        if (!wasActive) {
            activeBtn.classList.add('active');
            if (modeName === 'repeat') {
                audio.loop = true;
            }
        }

        return !wasActive; // 返回新状态
    }

// 随机播放按钮
    document.getElementById('randomBtn').addEventListener('click', () => {
        const isActive = toggleExclusive(
            document.getElementById('randomBtn'),
            document.getElementById('repeatBtn'),
            'random'
        );
        showNotification(`随机播放 ${isActive ? '已开启' : '已关闭'}`);
    });

// 循环播放按钮
    document.getElementById('repeatBtn').addEventListener('click', () => {
        const isActive = toggleExclusive(
            document.getElementById('repeatBtn'),
            document.getElementById('randomBtn'),
            'repeat'
        );
        showNotification(`循环播放 ${isActive ? '已开启' : '已关闭'}`);
    });

    // 进度条控制 (流兼容版本)
    document.querySelector('.progress-container').addEventListener('click', async (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        document.getElementById('songProgress').style.width = `${pos * 100}%`;

        // 等待音频元数据加载
        if (audio.readyState < 1) { // 0 = HAVE_NOTHING
            const waitForMetadata = new Promise((resolve) => {
                const handler = () => {
                    audio.removeEventListener('loadedmetadata', handler);
                    resolve();
                };
                audio.addEventListener('loadedmetadata', handler);
            });
            await waitForMetadata;
        }

        // 获取实际可用时长
        const duration = getSafeDuration();

        // 执行跳转
        const targetTime = pos * duration;

        try {
            audio.currentTime = targetTime;
        } catch (error) {
            console.error('进度跳转失败:', error);
            showNotification('此音频位置不可访问');
        }
    });

// 获取安全时长的辅助函数
    function getSafeDuration() {
        // 尝试获取有效时长
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
            return audio.duration;
        }

        // 对于直播流，提供备用值
        if (audio.seekable && audio.seekable.length > 0) {
            return audio.seekable.end(0);
        }

        // 默认回退（临时值）
        return currentSong?.duration || 60; // 60秒作为回退
    }


    let lastVolume = 0.7; // 默认初始值

    // 音量控制 (修复事件目标和边界问题)
    document.getElementById('volumeControl').addEventListener('click', (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();

        // 计算音量 (0-1)
        volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        // 更新UI和音频
        updateVolumeUI();
    });

    // 音量图标点击 (修复状态恢复逻辑)
    document.getElementById('volumeIcon').addEventListener('click', () => {
        if (volume > 0) {
            // 保存当前音量后静音
            lastVolume = volume;
            volume = 0;
            showNotification('已静音');
        } else {
            // 恢复静音前的音量
            volume = lastVolume;
            showNotification(`音量恢复: ${Math.round(volume * 100)}%`);
        }

        updateVolumeUI();
    });

    // 封装音量UI更新函数
    function updateVolumeUI() {
        // 更新音频音量
        audio.volume = volume;

        // 更新音量条UI
        document.getElementById('volumeLevel').style.width = `${volume * 100}%`;
    }


    // 音频时间更新
    audio.addEventListener('timeupdate', () => {
        if (!currentSong) return;

        const progress = (audio.currentTime / currentSong.duration) * 100;
        document.getElementById('songProgress').style.width = `${progress}%`;

        // 更新时间显示
        const minutes = Math.floor(audio.currentTime / 60);
        const seconds = Math.floor(audio.currentTime % 60);
        document.getElementById('currentTime').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    });

    // 歌曲结束事件
    audio.addEventListener('ended', () => {
        if (document.getElementById('repeatBtn').classList.contains('active')) {
            // 循环播放：重新播放当前歌曲
            audio.currentTime = 0;
            audio.play();
        } else {
            // 不循环：播放下一首
            playNext();
        }
    });

    // 搜索输入
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                searchMusic(query);
            }
        }
    });

    // 播放全部按钮
    document.querySelector('.btn-play-all').addEventListener('click', function() {
        if (songs.length > 0) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === currentSongIndex && songs.length > 1);
            playSongByIndex(randomIndex);
        }
    });
}

// 搜索音乐
async function searchMusic(query, page = 1) {
    try {
        const userData = JSON.parse(sessionStorage.getItem('userData'));

        currentQuery = query;
        searchCurrentPage = page

        // 保存原始状态
        if (!originalState) {
            saveOriginalState();
        }
        // 显示加载状态
        const container = document.querySelector('.container');
        container.innerHTML = `<div class="loading"><h2>正在搜索: ${query}</h2><div class="loading-spinner"></div></div>`;

        // 请求后端API
        const response = await fetch(`http://localhost:8080/song/search?keywords=${encodeURIComponent(query)}&page=${searchCurrentPage}&pageSize=${searchPageSize}`);

        // 检查HTTP状态
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }

        const result = await response.json(); // 解析JSON数据

        if (result.code === 1 && result.data) {
            const data = result.data;
            const songs = await Promise.all(data.rows.map(async song => {
                try {
                    const response = await fetch(`http://localhost:8080/user/${userData.userId}/liked-song/${song.songId}`);
                    const result = await response.json();
                    return {
                        ...song,
                        isLiked: result.code === 1
                    };
                } catch (error) {
                    console.error(`检查歌曲 ${song.id} 喜欢状态失败:`, error);
                    return {
                        ...song,
                        isLiked: false
                    };
                }
            }));
            searchTotalResults  = data.total;
            searchTotalPages = Math.ceil(searchTotalResults / searchPageSize);

            // 渲染搜索结果
            container.innerHTML = `
                <div class="section">
                    <div class="section-header">
                        <h2>搜索结果: ${query}</h2>
                        <a class="back-button" href="javascript:void(0)">
                            <i class="fas fa-arrow-left"></i> 返回
                        </a>
                    </div>
                    <div class="music-grid" id="searchResults"></div>
                    <div class="pagination" id="searchPagination"></div>
                </div>
            `;

            renderSearchPagination();

            const resultsGrid = document.getElementById('searchResults');
            songs.forEach((song, index) => {
                resultsGrid.appendChild(createSongCard(song, index));
            });



            document.querySelector('.back-button').addEventListener('click', restoreOriginalState);
        } else {
            let errorMessage = "未找到相关歌曲";
            if (result.code !== 1) {
                errorMessage = `搜索失败: ${result.msg || '服务器返回错误'}`;
            }

            container.innerHTML = `
                <div class="section">
                    <div class="section-header">
                        <h2>搜索结果: ${query}</h2>
                    </div>
                    <p class="no-results">${errorMessage}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('搜索错误:', error);
        document.querySelector('.container').innerHTML = `
            <div class="error-section">
                <p class="error">搜索失败: ${error.message}</p>
                <button class="retry-button" onclick="searchMusic('${query.replace(/'/g, "\\'")}')">重试</button>
            </div>
        `;
    }
}

// 创建歌曲卡片
function createSongCard(song, index) {
    const card = document.createElement('div');
    card.className = 'music-card';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="card-img">
            <img src="${song.cover}" alt="${song.title}" 
                 onerror="this.onerror=null;this.src='./images/null.jpg';" > 
            <div class="play-btn">
                <i class="fas fa-play"></i>
            </div>
            ${song.playCount ? `<div class="play-count">
                <i class="fas fa-play"></i> ${formatPlayCount(song.playCount)}
            </div>` : ''}
        </div>
        <div class="card-info">
            <div class="card-title">${song.title}</div>
            <div class="card-artist">${song.artist}</div>
        </div>
    `;

    // 点击播放歌曲
    card.addEventListener('click', () => {
        playSongBySong(song);
    });

    return card;
}

// 播放指定歌曲
function playSongBySong(song) {
    currentSong = song;
    songs[currentSongIndex] = song;
    updatePlayerInfo(currentSong);

    const playUrl = `http://localhost:8080/song/stream?id=${song.songId}`;

    // 播放音乐
    audio.src = playUrl || 'https://example.com/song1.mp3';
    audio.play();
    togglePlayPause(true);

    showNotification(`开始播放: ${song.title} - ${song.artist}`);
}

// 加载我的歌单
async function loadMyPlaylists(userData) {
    try {
        // 显示加载状态
        const grid = document.getElementById('myPlaylists');
        grid.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;

        // 加载数据
        const response = await fetch('http://localhost:8080/user/' + userData.userId + '/liked-song');
        const result = await response.json();

        // 渲染歌单
        grid.innerHTML = '';
        result.data.forEach(playlist => {
            grid.appendChild(createPlaylistCard(playlist));
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        document.getElementById('myPlaylists').innerHTML = '<p class="error">加载歌单失败</p>';
    }
}

// 加载喜欢的歌曲
async function loadLikedSongs(userData, page) {
    try {
        const list = document.getElementById('likedSongsList');
        // 使用数据
        const response = await fetch(`http://localhost:8080/user/${userData.userId}/liked-song?page=${page}&size=${songsPerPage}`); // 保存歌曲列表`
        const result = await response.json();
        songs = result.data.rows.map(song => ({
            ...song,
            isLiked: true
        }));
        totalSongs = result.data.total;
        totalPages  = Math.ceil(totalSongs / songsPerPage);
        document.getElementById('stat').textContent = totalSongs + '首歌曲';
        const coverImg = document.getElementById('cover-image');
        coverImg.src = songs[0].cover || './images/null.jpg';

        // 渲染喜欢的歌曲
        list.innerHTML = '';
        songs.forEach((song, index) => {
            list.appendChild(createSongRow(song, index));
        });
        updatePaginationControls();
        // 如果当前没有在播放，则设置第一首歌为当前歌曲
        if (songs.length > 0 && !currentSong) {
            currentSong = songs[0];
            playSongByIndex(0);
            updatePlayerInfo(currentSong);
        }
    } catch (error) {
        console.error('Error loading liked songs:', error);
        document.getElementById('likedSongsList').innerHTML = '<p class="error">加载喜欢的歌曲失败</p>';
    }
}

// 更新分页控件状态
function updatePaginationControls() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `${currentPage}/${totalPages}`;
}

// 分页按钮事件监听
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        loadLikedSongs(userData, currentPage);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        loadLikedSongs(userData, currentPage);
    }
});

// 加载最近播放
async function loadRecentlyPlayed() {
    try {
        const list = document.getElementById('recentSongs');

        // 使用模拟数据
        const data = await mockApiData('/api/recent-songs');

        // 渲染最近播放的歌曲
        list.innerHTML = '';
        data.forEach((song, index) => {
            list.appendChild(createSongRow(song, index, true));
        });
    } catch (error) {
        console.error('Error loading recently played:', error);
        document.getElementById('recentSongs').innerHTML = '<p class="error">加载最近播放失败</p>';
    }
}

// 创建播放列表卡片
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'music-card';
    card.innerHTML = `
        <div class="card-img">
            <img src="${playlist.cover}" alt="${playlist.title}">
            <div class="play-btn">
                <i class="fas fa-play"></i>
            </div>
            <div class="play-count">
                <i class="fas fa-play"></i> ${formatPlayCount(playlist.playCount)}
            </div>
        </div>
        <div class="card-info">
            <div class="card-title">${playlist.title}</div>
            <div class="card-artist">${playlist.songs}首歌曲</div>
        </div>
    `;

    // 点击播放列表
    card.addEventListener('click', () => {
        showNotification(`播放歌单: ${playlist.title}`);
    });

    return card;
}

// 创建歌曲行（列表模式）
function createSongRow(song, index, isRecent = false) {
    const row = document.createElement('div');
    row.className = 'song-row';
    row.dataset.index = index;


    row.innerHTML = `
        <div class="song-index">${index + 1 + (currentPage - 1) * songsPerPage}</div>
        <div class="song-info-row">
            <img src="${song.cover}" alt="${song.title}" 
                 onerror="this.onerror=null;this.src='./images/null.jpg';" class="song-cover-sm">
            <div>
                <div class="song-title-sm">${song.title}</div>
                <div class="song-artist-sm">${song.artist}</div>
            </div>
        </div>
        <div class="song-album">${song.album}</div>
        <div class="song-time">${formatTime(song.duration)}</div>
        <div class="song-actions">
            <button class="song-action-btn"><i class="fas fa-play"></i></button>
            <button class="song-action-btn like-btn" data-song-id="${song.id}">
            <i class="fas fa-heart ${song.isLiked ? 'is-liked-song' : ''}"></i></button>
        </div>
    `;

    // 添加喜欢/取消喜欢的事件监听
    row.querySelector('.like-btn').addEventListener('click', async (e) => {
        e.stopPropagation(); // 阻止事件冒泡到行点击事件
        await toggleLikeSong(song);
    });

    // 点击播放歌曲
    row.addEventListener('click', () => {
        playSongByIndex(index);
    });

    return row;
}

async function toggleLikeSong(song) {
    try {
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        if (!userData || !userData.userId) {
            showNotification('请先登录', true);
            return;
        }

        const response = await fetch(
            `http://localhost:8080/user/${userData.userId}/liked-song/${song.songId}`,
            {
                method: song.isLiked ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.ok) {
            // 更新本地歌曲列表的喜欢状态
            const songIndex = songs.findIndex(s => s.id === song.songId);
            if (songIndex !== -1) {
                songs[songIndex].isLiked = !song.isLiked;
                // 更新当前歌曲的喜欢状态
                currentSong.isLiked = !song.isLiked;
                // 更新UI而不需要重新加载
                updateSongUI(song.songId, !song.isLiked);
                updateLikeButton(!song.isLiked);
            }

            showNotification(song.isLiked ? '已从喜欢列表移除' : '已添加到喜欢列表');
        } else {
            throw new Error('请求失败');
        }
    } catch (error) {
        console.error('Error toggling like status:', error);
        showNotification('操作失败，请重试', true);
    }
}

// 新增的UI更新函数
function updateSongUI(songId, isLiked) {
    // 更新歌曲列表中的按钮状态
    const songElements = document.querySelectorAll(`[data-song-id="${songId}"]`);
    songElements.forEach(element => {
        const likeBtn = element.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.textContent = isLiked ? '❤️' : '🤍';
            likeBtn.dataset.liked = isLiked;
        }
    });

    // 如果是喜欢歌曲页面，可能需要从DOM中移除
    if (window.location.pathname.includes('liked-songs.html') && !isLiked) {
        songElements.forEach(element => element.remove());
    }
}

// 播放指定索引的歌曲
function playSongByIndex(index) {
    if (index >= 0 && index < songs.length) {
        currentSong = songs[index];
        currentSongIndex = index;
        updatePlayerInfo(currentSong);

        const playUrl = `http://localhost:8080/song/stream?id=${currentSong.songId}`;

        // 播放音乐
        audio.src = playUrl || 'https://example.com/song1.mp3';
        audio.play();
        togglePlayPause(true);

        showNotification(`开始播放: ${currentSong.title} - ${currentSong.artist}`);


        // 如果播放的是喜欢的歌曲，高亮该行
        document.querySelectorAll('.song-row').forEach(row => {
            row.classList.remove('playing');
        });
        document.querySelector(`.song-row[data-index="${index}"]`).classList.add('playing');
    }
}

// 播放下一首
function playNext() {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= songs.length) nextIndex = 0;

    if (document.getElementById('randomBtn').classList.contains('active')) {
        // 随机播放
        playRandomSong();
    } else {
        // 顺序播放
        playSongByIndex(nextIndex);
    }
}

// 播放上一首
function playPrev() {
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = songs.length - 1;
    playSongByIndex(prevIndex);
}

// 随机播放歌曲
function playRandomSong() {
    if (songs.length === 0) return;

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentSongIndex && songs.length > 1);

    playSongByIndex(randomIndex);
}

// 切换播放/暂停状态
function togglePlayPause() {
    if (audio.paused) {
        audio.play()
            .then(() => {
                updatePlayButton(true);
                if (currentSong) {
                    showNotification(`正在播放: ${currentSong.title}`);
                }
            })
            .catch(error => {
                console.error('播放失败:', error);
                updatePlayButton(false);
                showNotification('播放失败: ' + error.message);
            });
    } else {
        audio.pause();
        updatePlayButton(false);
        showNotification('暂停播放');
    }
}

audio.addEventListener('canplaythrough', () => {
    // 尝试自动播放（注意浏览器限制）
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // 自动播放成功
            updatePlayButton(true);
        }).catch(error => {
            // 自动播放被阻止
            console.log('自动播放被阻止:', error);
            updatePlayButton(false);
        });
    }
});

// 统一更新播放按钮状态的函数
function updatePlayButton(isPlaying) {
    const playIcon = document.getElementById('playIcon');
    if (isPlaying) {
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
        document.querySelector('.player-bar').classList.add('playing');
    } else {
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        document.querySelector('.player-bar').classList.remove('playing');
    }
    isPlaying = !audio.paused;
}


// 确保按钮点击事件正确绑定
document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);

// 音频结束时处理
audio.addEventListener('ended', () => {
    const playIcon = document.getElementById('playIcon');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    document.querySelector('.player-bar').classList.remove('playing');
    isPlaying = false;
});

// 更新播放器信息
function updatePlayerInfo(song) {
    document.getElementById('currentCover').src = song.cover || './images/null.jpg';
    document.getElementById('currentTitle').textContent = song.title;
    document.getElementById('currentArtist').textContent = song.artist;

    // 设置时长
    const totalMinutes = Math.floor(song.duration / 60);
    const totalSeconds = Math.floor(song.duration % 60);
    document.getElementById('totalTime').textContent = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;

    // 重置当前播放时间
    document.getElementById('currentTime').textContent = '0:00';
    document.getElementById('songProgress').style.width = '0%';

    // 更新喜欢按钮
    updateLikeButton(song.isLiked);
}

function updateLikeButton(isLiked) {
    const likeBtn = document.getElementById('likeCurrentSong');
    likeBtn.innerHTML = `<i class="fas fa-heart ${isLiked ? 'is-liked-song' : ''}"></i>`;
}

// 格式化播放次数
function formatPlayCount(playCount) {
    try {
        // 处理未定义或空值的情况
        if (playCount === null || playCount === undefined) {
            return '0';
        }

        // 转换并格式化播放次数
        const count = typeof playCount === 'number'
            ? playCount
            : Number(playCount) || 0;

        if (count >= 100000) {
            return (count / 10000).toFixed(1) + '万';
        } else {
            return count.toString();
        }
    } catch (e) {
        console.error('格式化播放次数错误:', e, playCount);
        return '0';
    }
}

// 格式化时间 (秒转分:秒)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 显示通知
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 喜欢/取消喜欢歌曲
document.getElementById('likeCurrentSong').addEventListener('click', async () => {
    if (currentSong) {
        await toggleLikeSong(currentSong);
    }
});

// 恢复初始状态
function restoreOriginalState() {
    if (originalState) {
        const container = document.querySelector('.container');
        container.innerHTML = originalState;

        // 重新绑定事件监听器（因为DOM被替换了）
        setupEventListeners();

        // 重新加载数据
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        loadMyPlaylists(userData);
        loadLikedSongs(userData, currentPage);
        loadRecentlyPlayed(userData);
    }
}

function renderSearchPagination() {
    if (searchTotalPages <= 1) return; // 只有一页时不显示分页

    const pagination = document.getElementById('searchPagination');
    pagination.innerHTML = '';

    // 上一页按钮
    if (searchCurrentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', () => searchMusic(currentQuery, searchCurrentPage - 1));
        pagination.appendChild(prevBtn);
    }

    // 页码按钮
    const maxVisiblePages = 5; // 最多显示5个页码
    let startPage = Math.max(1, searchCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(searchTotalPages, startPage + maxVisiblePages - 1);

    // 调整起始页码以确保显示足够的页码
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === searchCurrentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => searchMusic(currentQuery, i));
        pagination.appendChild(pageBtn);
    }

    // 下一页按钮
    if (searchCurrentPage < searchTotalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', () => searchMusic(currentQuery, searchCurrentPage + 1));
        pagination.appendChild(nextBtn);
    }

    // 添加总页数信息
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `共 ${searchTotalResults} 条结果，${searchTotalPages} 页`;
    pagination.appendChild(pageInfo);
}
