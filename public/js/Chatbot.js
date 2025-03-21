// Lưu tin nhắn vào sessionStorage
function saveChatHistory() {
    const messageArea = document.getElementById("messages");
    const messages = messageArea.innerHTML;
    sessionStorage.setItem("chatHistory", messages);
}
// Tải lại lịch sử trò chuyện từ sessionStorage khi mở lại trang
function loadChatHistory() {
    const messageArea = document.getElementById("messages");
    const savedMessages = sessionStorage.getItem("chatHistory");
    if (savedMessages) {
        messageArea.innerHTML = savedMessages;
    }
}
// Hàm để chuyển đổi trạng thái của chatbox (hiện/ẩn)
function toggleChat() {
    const chatbox = document.getElementById("chatbox");
    const messageArea = document.getElementById("messages");
    
    if (chatbox.style.display === "block") {
        chatbox.style.display = "none";
    } else {
        chatbox.style.display = "block";
        if (messageArea.innerHTML === "") {
            // Gửi câu hỏi ban đầu khi mở chat
            sendBotMessage('DHH Store là một trang web bán laptop và phụ kiện trực tuyến, chuyên cung cấp đa dạng các dòng sản phẩm từ nhiều thương hiệu khác nhau. Với sứ mệnh mang đến giải pháp công nghệ chất lượng, DHH Store không chỉ cung cấp nền tảng mua sắm tiện lợi mà còn hỗ trợ khách hàng trong việc lựa chọn sản phẩm phù hợp, đảm bảo trải nghiệm mua sắm an toàn và tối ưu.');
            displayQuestions();  // Hiển thị câu hỏi sau khi mở chat
        }
        scrollToBottom(); // Cuộn xuống dưới khi mở chat
    }
}

// Hàm gửi tin nhắn của bot
function sendBotMessage(message) {
    const messageArea = document.getElementById("messages");
    const botMessage = document.createElement("div");
    botMessage.classList.add("bot-message");
    botMessage.innerText = message;
    messageArea.appendChild(botMessage);

    // Cuộn xuống dưới khi có tin nhắn mới
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Hàm tạo câu hỏi và thêm vào chatbox
function displayQuestions() {
    const messageArea = document.getElementById("messages");

    const questions = [
        { text: "Laptop bán chạy nhất ở đây là gì?", answer: "Laptop bán chạy nhất hiện nay là 'Dell XPS 13' với hiệu năng mạnh mẽ và thiết kế cao cấp." },
        { text: "Chính sách bảo hành ở đây là gì?", answer: "Mỗi sản phẩm đều có chính sách bảo hành riêng, nhưng có thể đổi trả trong vòng 7 ngày nếu laptop hoặc phụ kiện bị lỗi." },
        { text: "Shop có bán sản phẩm chính hãng không?", answer: "Tất cả sản phẩm bán tại DHH Store đều là laptop chính hãng, cam kết chất lượng." }
    ];    

    questions.forEach(question => {
        const button = document.createElement("button");
        button.innerText = question.text;
        button.onclick = function() {
            sendAnswer(question.answer, button);
        };
        messageArea.appendChild(button);  // Thêm câu hỏi vào messageArea
    });

}

function sendAnswer(answer, questionButton) {
    const messageArea = document.getElementById("messages");

    // Tạo tin nhắn bot
    const botMessage = document.createElement("div");
    botMessage.classList.add("bot-message");

    // Kiểm tra nếu câu trả lời chứa một URL
    const linkRegex = /https?:\/\/[^\s]+/g;
    const containsLink = answer.match(linkRegex);

    if (containsLink) {
        // Nếu câu trả lời có chứa đường link, thay thế URL bằng thẻ <a>
        answer = answer.replace(linkRegex, function(url) {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });

        botMessage.innerHTML = answer;  // Dùng innerHTML để có thể hiển thị đường link
    } else {
        botMessage.innerText = answer;  // Nếu không có URL, dùng innerText để tránh thẻ HTML
    }

    messageArea.appendChild(botMessage);

    // Cuộn xuống cuối cùng để thấy tin nhắn mới
    messageArea.scrollTop = messageArea.scrollHeight;

    // Xóa câu hỏi đã được nhấn
    if (questionButton) {
        questionButton.remove();
    }

    scrollToBottom(); // Cuộn xuống cuối sau khi gửi câu trả lời
};

// Hàm kiểm tra và gửi câu trả lời từ người dùng
function sendMessage() {
    const userInput = document.getElementById("userInput").value;
    if (!userInput.trim()) return;  // Nếu input rỗng thì không gửi tin nhắn

    const messageArea = document.getElementById("messages");

    // Tạo một container cho tin nhắn người dùng và icon
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("user-message");

    // Tạo icon cho người dùng (nếu cần)
    const userIcon = document.createElement("div");
    userIcon.classList.add("user-icon");

    // Tạo tin nhắn của người dùng
    const userMessage = document.createElement("div");
    userMessage.classList.add("message-text");
    userMessage.innerText = userInput;

    // Thêm icon và tin nhắn vào container
    messageContainer.appendChild(userIcon);
    messageContainer.appendChild(userMessage);

    // Thêm container vào khu vực tin nhắn
    messageArea.appendChild(messageContainer);

    // Cuộn xuống dưới khi có tin nhắn mới
    messageArea.scrollTop = messageArea.scrollHeight;

    // Gửi câu trả lời tự động từ bot dựa trên câu hỏi của người dùng
    autoReply(userInput);

    // Làm sạch input sau khi gửi
    document.getElementById("userInput").value = '';
    
    // Lưu lịch sử
    saveChatHistory();
}   

// Hàm trả lời tự động từ bot dựa trên câu hỏi của người dùng
function autoReply(userInput) {
    const messageArea = document.getElementById("messages");

    let botResponse = "Xin lỗi, tôi không hiểu câu hỏi của bạn. Đây là tin nhắn tự động. Vui lòng liên hệ thông qua trang facebook chính thức";
    // Kiểm tra các từ khóa trong câu hỏi người dùng và trả lời phù hợp
    if (userInput.toLowerCase().includes("laptop bán chạy") || userInput.toLowerCase().includes("laptop hot") || userInput.toLowerCase().includes("best seller") || userInput.toLowerCase().includes("máy tính hot")) {
        botResponse = "Laptop bán chạy nhất hiện nay là 'Dell XPS 13' với hiệu năng mạnh mẽ và thiết kế cao cấp. (Bot Reply)";
    } else if (userInput.toLowerCase().includes("bảo hành") || userInput.toLowerCase().includes("đổi trả")) {
        botResponse = "Mỗi sản phẩm đều có chính sách bảo hành riêng, nhưng có thể đổi trả trong vòng 7 ngày nếu laptop hoặc phụ kiện bị lỗi. (Bot Reply)";
    } else if (userInput.toLowerCase().includes("laptop chính hãng") || userInput.toLowerCase().includes("hợp lệ") || userInput.toLowerCase().includes("uy tín")) {
        botResponse = "Tất cả laptop bán tại DHH Store đều là sản phẩm chính hãng, cam kết chất lượng. (Bot Reply)";
    } else if (userInput.toLowerCase().includes("ship") || userInput.toLowerCase().includes("có ship không ạ ?") || userInput.toLowerCase().includes("giao hàng")) {
        botResponse = "Thời gian ship hàng là 2-3 ngày trong TP.HCM và 4-5 ngày ở các tỉnh thành khác kể từ khi nhận được đơn hàng. (Bot Reply)";
    } else if (userInput.toLowerCase().includes("chào shop") || userInput.toLowerCase().includes("hi") || userInput.toLowerCase().includes("hello") || userInput.toLowerCase().includes("dạ chào shop")) {
        botResponse = "Chào bạn, tôi là bot của shop bán laptop DHH Store, mọi câu trả lời của tôi được lập trình sẵn. Nếu cần tư vấn riêng hãy liên hệ trang Facebook cá nhân của shop.";
    } else if (userInput.toLowerCase().includes("mượn laptop") || userInput.toLowerCase().includes("thuê laptop") || userInput.toLowerCase().includes("rent") || userInput.toLowerCase().includes("mướn laptop")) {
        botResponse = "Shop chỉ bán laptop chứ không cho thuê. Mong bạn thông cảm. (Bot Reply)";
    }    
    
    // Tạo tin nhắn bot trả lời
    const botMessage = document.createElement("div");
    botMessage.classList.add("bot-message");
    botMessage.innerText = botResponse;
    messageArea.appendChild(botMessage);

    // Cuộn xuống dưới khi có tin nhắn mới
    messageArea.scrollTop = messageArea.scrollHeight;

}

// Hàm cuộn xuống dưới cùng của khung chat
function scrollToBottom() {
    const messageArea = document.getElementById("messages");
    messageArea.scrollTop = messageArea.scrollHeight;
}
window.onload = loadChatHistory;
