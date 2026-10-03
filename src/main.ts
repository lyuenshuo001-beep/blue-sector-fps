import './style.css';
import './lobby.css';
import { loadInfected } from './pve/InfectedAssets';
import './pve.css';
import { Game } from './core/Game';
async function boot() {
    try {
        document.querySelector('#app')!.innerHTML = '<div id="asset-loading">闪烁行动 <small>LAST SECTOR · 正在准备感染区资源…</small><progress max="1" value="0"></progress></div>';
        await loadInfected(n => { document.querySelector<HTMLProgressElement>('progress')!.value = n; });
        document.querySelector('#app')!.innerHTML = '';
        const game = new Game();
        if (import.meta.url.includes('/src/') || new URLSearchParams(location.search).has('test'))
            (window as unknown as {
                __game: Game;
            }).__game = game;
    }
    catch (error) {
        console.error(error);
        document.querySelector('#app')!.innerHTML = '<section style="padding:10%;line-height:2"><h1 style="font-size:32px">无法启动 3D 游戏</h1><p>游戏资源加载失败，或当前设备无法启动 WebGL。请检查网络后重试。</p><p>建议使用系统浏览器打开：Safari / Chrome / Edge，并检查硬件加速。</p><button onclick="location.reload()">重新加载</button></section>';
    }
}
const ready = boot();
if ('serviceWorker' in navigator && !import.meta.url.includes('/src/')) {
    addEventListener('load', async () => {
        await ready;
        try {
            const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
            let requestedUpdate = false;
            const notify = () => {
                if (!reg.waiting)
                    return;
                document.getElementById('update-notice')?.classList.remove('hidden');
                document.getElementById('update')!.onclick = () => { requestedUpdate = true; reg.waiting?.postMessage({ type: 'SKIP_WAITING' }); };
            };
            notify();
            reg.addEventListener('updatefound', () => { reg.installing?.addEventListener('statechange', notify); });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (requestedUpdate && !refreshing) {
                    refreshing = true;
                    location.reload();
                }
            });
            await reg.update();
        }
        catch (e) {
            console.info('Offline cache unavailable', e);
        }
    });
}
