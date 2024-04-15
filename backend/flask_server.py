from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from tensorflow.keras.datasets import mnist # type: ignore

app = Flask(__name__)
CORS(app)

(_, _), (x_test, y_test) = mnist.load_data()
x_test = x_test.astype('float32') / 255.0
x_test = x_test.reshape(x_test.shape[0], 28, 28, 1)

model = tf.keras.models.load_model('mnist_cnn_model.h5')

@app.route('/predict', methods=['POST'])

# Function predict receives a stringified JSON object with the key 'image'
# The value of 'image' is a (28, 28, 1) numpy array with pixel values between 0 and 1
def predict():
    data = request.get_json(force=True)
    # print shape of data
    print("Image shape: ", np.array(data['image']).shape)
    # Convert canvas data to a numpy array
    image = np.array(data['image'], dtype=np.float32)
    reshaped_image = image.reshape(1,image.shape[0],image.shape[1],image.shape[2])
    prediction = model.predict([reshaped_image])
    predicted_class = int(np.argmax(prediction))
    return jsonify(prediction=predicted_class)

@app.route('/random', methods=['GET'])
def random_image():
    random_index = np.random.randint(len(x_test))
    image = x_test[random_index].tolist()  # Convert numpy array to list
    label = int(y_test[random_index])
    return jsonify(image=image, label=label)

if __name__ == '__main__':
    app.run(debug=True)