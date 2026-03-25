import sys
import json
import cv2
import numpy as np
import tensorflow as tf
import os

# ======================
# PATHS
# ======================
MODEL_DET = r"Straw_HoaQua_int8.tflite"
MODEL_STAGE = r"Straw_4stages_int8.tflite"

INPUT_SIZE = 320
CONF_THRESHOLD = 0.5
NMS_THRESHOLD = 0.45

det_classes = ["Strawberry", "Flower"]
stage_classes = ["Green", "Ripe", "Damaged", "Turning"]

# NEW: Mapped to perfectly match your updated types.tsx!
REACT_STAGE_MAP = {
    "Green": "green",
    "Ripe": "ripe",
    "Damaged": "damaged",
    "Turning": "turningRed",
    "Flower": "flower",
    "undetected": "undetected",
}


def load_model(path):
    interpreter = tf.lite.Interpreter(model_path=path)
    interpreter.allocate_tensors()
    return interpreter


det_model = load_model(MODEL_DET)
stage_model = load_model(MODEL_STAGE)
det_in, det_out = det_model.get_input_details(), det_model.get_output_details()
stage_in, stage_out = stage_model.get_input_details(), stage_model.get_output_details()


def preprocess(image, input_details):
    img = cv2.resize(image, (INPUT_SIZE, INPUT_SIZE))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    scale, zero = input_details[0]["quantization"]
    img = img.astype(np.float32) / 255.0
    img = img / scale + zero
    img = img.astype(np.int8)
    return np.expand_dims(img, axis=0)


def run_inference(interpreter, input_details, output_details, image):
    inp = preprocess(image, input_details)
    interpreter.set_tensor(input_details[0]["index"], inp)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"])
    scale, zero = output_details[0]["quantization"]
    return (output[0].astype(np.float32) - zero) * scale


def parse_detections(pred, orig_w, orig_h):
    boxes, class_probs = pred[0:4], pred[4:]
    boxes_xywh, conf_list, class_ids = [], [], []

    for i in range(class_probs.shape[1]):
        class_id = np.argmax(class_probs[:, i])
        conf = class_probs[class_id][i]
        if conf < CONF_THRESHOLD:
            continue

        x, y, w, h = boxes[:, i]
        x1, y1 = int((x - w / 2) * orig_w), int((y - h / 2) * orig_h)
        x2, y2 = int((x + w / 2) * orig_w), int((y + h / 2) * orig_h)

        boxes_xywh.append([x1, y1, x2 - x1, y2 - y1])
        conf_list.append(float(conf))
        class_ids.append(class_id)

    indices = cv2.dnn.NMSBoxes(boxes_xywh, conf_list, CONF_THRESHOLD, NMS_THRESHOLD)
    results = []
    if len(indices) > 0:
        for i in indices:
            i = i[0] if isinstance(i, (list, tuple, np.ndarray)) else i
            results.append({
                "box": boxes_xywh[i],
                "class_id": class_ids[i],
                "conf": conf_list[i],
            })
    return results


def draw_label(image, x, y, w, h, label, box_color, text_color=(255, 255, 255)):
    cv2.rectangle(image, (x, y), (x + w, y + h), box_color, 2)
    font = cv2.FONT_HERSHEY_SIMPLEX
    (text_w, text_h), _ = cv2.getTextSize(label, font, 0.5, 1)
    text_y = y - 5 if y - 5 > text_h else y + text_h + 5
    cv2.rectangle(
        image, (x, text_y - text_h - 4), (x + text_w, text_y + 2), box_color, -1
    )
    cv2.putText(image, label, (x, text_y), font, 0.5, text_color, 1)


def process_upload(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not read image file.")

        orig_h, orig_w = image.shape[:2]
        det_pred = run_inference(det_model, det_in, det_out, image)
        detections = parse_detections(det_pred, orig_w, orig_h)

        # NEW: Start with the "undetected" fallback
        best_overall_stage = "undetected"
        best_overall_conf = 0.0
        found_strawberry = False

        for det in detections:
            x, y, w, h = det["box"]
            class_id = det["class_id"]
            label = det_classes[class_id]

            if label == "Flower":
                if not found_strawberry and det["conf"] > best_overall_conf:
                    best_overall_stage = "Flower"
                    best_overall_conf = det["conf"]
                draw_label(image, x, y, w, h, f"Flower {det['conf']:.2f}", (0, 200, 0))

            elif label == "Strawberry":
                found_strawberry = True
                crop = image[max(0, y) : max(0, y + h), max(0, x) : max(0, x + w)]
                if crop.size == 0:
                    continue

                stage_pred = run_inference(stage_model, stage_in, stage_out, crop)
                stage_dets = parse_detections(stage_pred, w, h)

                if len(stage_dets) > 0:
                    best = max(stage_dets, key=lambda d: d["conf"])
                    stage_label = stage_classes[best["class_id"]]

                    if (
                        best["conf"] > best_overall_conf
                        or best_overall_stage == "Flower"
                    ):
                        best_overall_stage = stage_label
                        best_overall_conf = best["conf"]

                    draw_label(
                        image,
                        x,
                        y,
                        w,
                        h,
                        f"{stage_label} {best['conf']:.2f}",
                        (0, 0, 255),
                    )

        # ... (after all the draw_label calls) ...

        # Save the marked-up image
        processed_path = image_path + "_processed.jpg"
        cv2.imwrite(processed_path, image)

        # Send the JSON back to Node with the NEW path
        result = {
            "stage": REACT_STAGE_MAP.get(best_overall_stage, "undetected"),
            "confidence": round(float(best_overall_conf), 2),
            "processed_image": processed_path,  # Tell Node where the new image is
        }
        print(json.dumps(result))

    except Exception as e:
        # Failsafe output so Node.js doesn't crash, strict typing enforced
        print(json.dumps({"stage": "undetected", "confidence": 0, "error": str(e)}))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_upload(sys.argv[1])
    else:
        print(json.dumps({"error": "No image path provided", "stage": "undetected"}))
