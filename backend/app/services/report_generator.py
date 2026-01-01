import matplotlib
matplotlib.use("Agg")        # GUI 없이 서버에서 실행하도록 설정
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import os, io, base64
from math import pi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "data/sense_clean.csv")


def generate_report_base64(product_name: str) -> str:
    df = pd.read_csv(CSV_PATH)

    if product_name not in df['name'].values:
        raise Exception("제품명이 CSV에 없음")

    product = df[df['name'] == product_name].iloc[0]
    attrs = ['aroma','sweetness','acidity','body','carbonation','complexity']

    fig = plt.figure(figsize=(14,10))
    plt.suptitle(f'제품 분석 리포트: {product_name}', fontsize=22)

    angle = [n/len(attrs)*2*pi for n in range(len(attrs))]+[0]
    values = product[attrs].tolist()+[product[attrs[0]]]

    # Radar
    ax = plt.subplot(221, polar=True)
    ax.plot(angle, values, color='red'); ax.fill(angle, values, alpha=0.3)
    ax.set_xticks(angle[:-1]); ax.set_xticklabels(attrs)

    # Rank
    ax2 = plt.subplot(222)
    ranks = [(df[a] < product[a]).mean()*100 for a in attrs]
    sns.barplot(x=ranks, y=attrs, ax=ax2)

    # Scatter
    ax3 = plt.subplot(223)
    sns.scatterplot(data=df, x='abv', y='sweetness', alpha=0.3, color='gray', ax=ax3)
    sns.scatterplot(x=[product['abv']], y=[product['sweetness']], color='red', s=200, marker='*')

    # Dist
    ax4 = plt.subplot(224)
    sns.histplot(df['overall_score'], kde=True, color='skyblue', ax=ax4)
    ax4.axvline(product['overall_score'], color='red', linestyle='--')

    # ------- 🔥 이미지 base64 변환 -------
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=150)
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close()

    return img_base64
