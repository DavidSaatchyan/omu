from PIL import Image, ImageDraw

# Укажи имя твоего файла
input_file = 'Logo.png'  # поменяй на имя твоего файла
output_file = 'logo_640x360.png'

# Целевой размер
target_width = 640
target_height = 360

# Открываем изображение
img = Image.open(input_file).convert('RGB')

# Создаём новое полотно нужного размера с фоном
# Цвет фона — чёрный (можно поменять на любой)
background_color = (0, 0, 0)  # чёрный
# Альтернативы:
# background_color = (245, 240, 232)  # цвет фона твоего приложения
# background_color = (255, 255, 255)  # белый

new_img = Image.new('RGB', (target_width, target_height), background_color)

# Масштабируем исходное изображение, чтобы оно вписалось
# Не обрезаем, а сохраняем пропорции
img.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)

# Вычисляем позицию для вставки (по центру)
x = (target_width - img.width) // 2
y = (target_height - img.height) // 2

# Вставляем изображение на полотно
new_img.paste(img, (x, y))

# Сохраняем
new_img.save(output_file, quality=95)
print(f"✅ Готово: {output_file} ({new_img.size[0]}x{new_img.size[1]})")
print(f"   Исходное изображение вставлено без обрезки, добавлены поля.")