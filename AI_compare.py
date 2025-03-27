import json
from flask import Flask, request, jsonify
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/compare": {"origins": "*"}})

# Tải mô hình AI mạnh hơn
try:
    model_name = "EleutherAI/gpt-neo-1.3B"  # Mô hình mạnh hơn GPT-2
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = pipeline("text-generation", model=model_name)
    max_length = tokenizer.model_max_length  # Lấy độ dài tối đa của mô hình
    print(f"✅ Mô hình AI đã sẵn sàng! Độ dài prompt tối đa: {max_length}")
except Exception as e:
    print(f"❌ Lỗi khi tải mô hình: {e}")
    model = None
    max_length = 512  # Giá trị mặc định nếu không lấy được

@app.route('/compare', methods=['POST'])
def compare_laptops():
    if model is None:
        return jsonify({"message": "Lỗi: Mô hình AI chưa sẵn sàng"}), 500

    try:
        # Đọc dữ liệu đầu vào từ request
        data = request.get_json()
        print("📥 Dữ liệu JSON nhận được:", request.get_data(as_text=True))

        # Xử lý lỗi JSON đầu vào
        if isinstance(data, str):
            data = json.loads(data)

        if not isinstance(data, dict):
            return jsonify({"message": "Dữ liệu đầu vào không hợp lệ"}), 400

        # Kiểm tra thông tin laptop
        laptop1 = data.get('laptop1', {})
        laptop2 = data.get('laptop2', {})

        if not isinstance(laptop1, dict) or not isinstance(laptop2, dict):
            return jsonify({"message": "Lỗi: Dữ liệu laptop không hợp lệ"}), 400

        # Loại bỏ trường description nếu có
        laptop1.pop("description", None)
        laptop2.pop("description", None)

        # Lấy thông tin chính của laptop
        laptop1_name = laptop1.get('name', 'Laptop 1')
        laptop2_name = laptop2.get('name', 'Laptop 2')
        cpu1 = laptop1.get('cpu', 'Không rõ')
        cpu2 = laptop2.get('cpu', 'Không rõ')
        gpu1 = laptop1.get('gpu', 'Không rõ')
        gpu2 = laptop2.get('gpu', 'Không rõ')
        ram1 = laptop1.get('ram', 'Không rõ')
        ram2 = laptop2.get('ram', 'Không rõ')
        price1 = laptop1.get('price', 'Không rõ')
        price2 = laptop2.get('price', 'Không rõ')

        # Xây dựng prompt tốt hơn
        prompt = (
            f"So sánh hiệu năng giữa {laptop1_name} và {laptop2_name}. "
            f"{laptop1_name} có CPU {cpu1}, GPU {gpu1}, RAM {ram1}, giá {price1} VND. "
            f"{laptop2_name} có CPU {cpu2}, GPU {gpu2}, RAM {ram2}, giá {price2} VND. "
            "Hãy nhận xét về hiệu năng tổng thể, ưu điểm và nhược điểm của từng laptop. "
            "Đưa ra gợi ý nên mua laptop nào dựa trên nhu cầu sử dụng, không nhắc lại thông số kỹ thuật."
        )
        prompt = prompt[:max_length]  # Giới hạn độ dài prompt theo mô hình

        # Gọi AI xử lý
        response_list = model(prompt, max_new_tokens=50, num_return_sequences=1)

        if not response_list:
            return jsonify({"message": "Lỗi: Không nhận được phản hồi từ AI"}), 500

        response = response_list[0].get('generated_text', 'Không có phản hồi từ AI')

        return jsonify({"message": response})

    except json.JSONDecodeError:
        return jsonify({"message": "Lỗi: Không thể giải mã JSON"}), 400
    except Exception as e:
        print(f"❌ Lỗi khi xử lý yêu cầu: {e}")
        return jsonify({"message": "Lỗi khi xử lý yêu cầu AI"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
