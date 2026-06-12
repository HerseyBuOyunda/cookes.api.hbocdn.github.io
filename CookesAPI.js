const CookieHub = {
    hubUrl: "https://cookes.api.hbocdn.github.io",
    iframe: null,
    isReady: false,
    queue: [],
    requests: {},
    requestId: 0,

    init() {
        return new Promise((resolve) => {
            if (this.isReady) return resolve();

            // Arka planda gizli bir iframe oluştur
            this.iframe = document.createElement("iframe");
            this.iframe.src = this.hubUrl;
            this.iframe.style.display = "none";
            document.body.appendChild(this.iframe);

            // İletişim dinleyicisini başlat
            window.addEventListener("message", (event) => {
                if (event.origin !== this.hubUrl) return;
                
                const { id, success, value, error } = event.data;
                if (this.requests[id]) {
                    if (success) {
                        this.requests[id].resolve(value);
                    } else {
                        this.requests[id].reject(error);
                    }
                    delete this.requests[id];
                }
            });

            this.iframe.onload = () => {
                this.isReady = true;
                resolve();
                // Sırada bekleyen istekler varsa çalıştır
                this.queue.forEach(req => req());
                this.queue = [];
            };
        });
    },

    send(action, key = null, value = null) {
        return new Promise((resolve, reject) => {
            const execute = () => {
                this.requestId++;
                this.requests[this.requestId] = { resolve, reject };
                this.iframe.contentWindow.postMessage({
                    id: this.requestId,
                    action,
                    key,
                    value
                }, this.hubUrl);
            };

            if (this.isReady) {
                execute();
            } else {
                this.queue.push(execute);
            }
        });
    },

    // Kullanacağın ana fonksiyonlar
    set(key, value) { return this.send("SET", key, value); },
    get(key) { return this.send("GET", key); },
    remove(key) { return this.send("REMOVE", key); },
    clear() { return this.send("CLEAR"); }
};

// Sayfa açılır açılmaz köprüyü kur
CookieHub.init();
