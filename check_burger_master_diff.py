import cv2
import numpy as np
import os

burger_path = r'c:\MestiDelivery\Frontend\scripts\menu_photos\burgers\burgers-01-cheeseburger.jpg'
master_png_path = r'C:\MestiDelivery\Frontend\Assets\bbq_plate_45_empty_MASTER.png'
master_f75_path = r'C:\MestiDelivery\Frontend\Assets\bbq_vessels\bbq_master_V1_45_F75.jpg'

im_burger = cv2.imread(burger_path) # 900x900
im_master_png = cv2.imread(master_png_path) # 1024x1024
im_master_f75 = cv2.imread(master_f75_path) # 1024x1024

# Let's resize master to 900x900 and see how table/napkin/plate match burger
master_900 = cv2.resize(im_master_png, (900, 900), interpolation=cv2.INTER_LANCZOS4)

# Difference in corners (background table)
diff_tl = np.abs(master_900[:100, :100].astype(float) - im_burger[:100, :100].astype(float)).mean()
diff_tr = np.abs(master_900[:100, -100:].astype(float) - im_burger[:100, -100:].astype(float)).mean()
print(f"Table background difference: TL={diff_tl:.2f}, TR={diff_tr:.2f}")

# Let's check master F75 as well
f75_900 = cv2.resize(im_master_f75, (900, 900), interpolation=cv2.INTER_LANCZOS4)
diff_f75_tl = np.abs(f75_900[:100, :100].astype(float) - im_burger[:100, :100].astype(float)).mean()
diff_f75_tr = np.abs(f75_900[:100, -100:].astype(float) - im_burger[:100, -100:].astype(float)).mean()
print(f"F75 background difference: TL={diff_f75_tl:.2f}, TR={diff_f75_tr:.2f}")
