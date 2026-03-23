(function() {
    function detectDebugger() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        return (end - start) > 100;
    }
    
    if (detectDebugger()) {
        document.body.innerHTML = '<h1>Không được phép debug</h1>';
        throw new Error('Debugger detected');
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            return false;
        }
    });
})();
(function() {
    let devtools = /./;
    devtools.toString = function() {
        this.opened = true;
        return '';
    };
    
    function detectDevTools() {
        const startTime = performance.now();
        debugger;
        const endTime = performance.now();
        
        if (endTime - startTime > 100) {
            return true;
        }
        
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtools.opened = true;
                return '';
            }
        });
        
        console.log(element);
        return devtools.opened === true;
    }
    
    function blockPage() {
        alert('⚠️ PHÁT HIỆN CÔNG CỤ PHÁT TRIỂN!\nVui lòng tắt DevTools để tiếp tục sử dụng trang.');
        
        setTimeout(function() {
            document.body.innerHTML = '';
            document.head.innerHTML = '';
            
            document.body.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                z-index: 99999;
            `;
            
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h2>🚫 Truy cập bị từ chối</h2>
                    <p>Vui lòng tắt DevTools để tiếp tục sử dụng trang web.</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                        Thử lại
                    </button>
                </div>
            `;
            document.body.appendChild(message);
            
            throw new Error('DevTools detected - Page blocked');
        }, 100);
    }
    
    setInterval(function() {
        if (detectDevTools()) {
            blockPage();
        }
    }, 1000);
    
    window.addEventListener('resize', function() {
        if (detectDevTools()) {
            blockPage();
        }
    });
    
    if (detectDevTools()) {
        blockPage();
    }
})();