use axum::{http::Method, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

// ============================================================
// Request & Response Structs
// ============================================================

/// รับค่าจำนวนเชิงซ้อน z = re + im·i จาก Frontend
#[derive(Deserialize)]
struct CalculateRequest {
    re: f64, // ส่วนจริง (Real part, a)
    im: f64, // ส่วนจินตภาพ (Imaginary part, b)
}

/// ส่งผลลัพธ์กลับไปยัง Frontend
#[derive(Serialize)]
struct CalculateResponse {
    re: f64,
    im: f64,
    magnitude: f64,     // r = √(a² + b²)
    argument_rad: f64,  // θ ในหน่วยเรเดียน
    argument_deg: f64,  // θ ในหน่วยองศา
    polar_form: String, // รูปเชิงขั้ว เช่น "5(cos 53.13° + i sin 53.13°)"
    steps: Vec<String>, // วิธีทำแบบ Step-by-Step (ภาษาไทย)
}

// ============================================================
// Handler: POST /calculate
// ============================================================

/// คำนวณค่า Magnitude (r) และ Argument (θ) ของจำนวนเชิงซ้อน
/// ใช้ atan2 เพื่อจัดการ Quadrant ให้ถูกต้อง 100%
async fn calculate(Json(req): Json<CalculateRequest>) -> Json<CalculateResponse> {
    let a = req.re;
    let b = req.im;

    // --- Step 1: คำนวณ Magnitude (r) ---
    // r = √(a² + b²) ← ใช้ hypot เพื่อความแม่นยำและป้องกัน overflow
    let r = a.hypot(b);

    // --- Step 2: คำนวณ Argument (θ) ด้วย atan2 ---
    // atan2(b, a) จะคืนค่า θ ในช่วง (-π, π] ซึ่งจัดการทุก Quadrant ให้อัตโนมัติ
    let theta_rad = b.atan2(a);
    let theta_deg = theta_rad.to_degrees();

    // --- สร้าง Step-by-Step Solution (ภาษาไทย) ---
    let steps = vec![
        format!(
            "📌 Step 1: กำหนดค่า z = {} + {}i (ส่วนจริง a = {}, ส่วนจินตภาพ b = {})",
            a, b, a, b
        ),
        format!("📐 Step 2: หาค่า r (Magnitude) จากสูตร r = √(a² + b²)"),
        format!(
            "   ➜ r = √(({})² + ({})²) = √({} + {}) = √{} = {:.4}",
            a,
            b,
            a * a,
            b * b,
            a * a + b * b,
            r
        ),
        format!("📏 Step 3: หาค่า θ (Argument) จากสูตร θ = atan2(b, a)"),
        format!(
            "   ➜ θ = atan2({}, {}) = {:.4} เรเดียน = {:.4}°",
            b, a, theta_rad, theta_deg
        ),
        determine_quadrant(a, b),
        format!("✅ Step 5: เขียนในรูปเชิงขั้ว (Polar Form)"),
        format!(
            "   ➜ z = {:.4}(cos {:.4}° + i sin {:.4}°)",
            r, theta_deg, theta_deg
        ),
    ];

    // --- สร้าง Polar Form String ---
    let polar_form = format!("{:.4}(cos {:.4}° + i sin {:.4}°)", r, theta_deg, theta_deg);

    Json(CalculateResponse {
        re: a,
        im: b,
        magnitude: r,
        argument_rad: theta_rad,
        argument_deg: theta_deg,
        polar_form,
        steps,
    })
}

/// ระบุว่าจุด (a, b) อยู่ใน Quadrant ใดของระนาบเชิงซ้อน
fn determine_quadrant(a: f64, b: f64) -> String {
    let quadrant = if a > 0.0 && b >= 0.0 {
        "Quadrant I (มุมบวก, 0° ≤ θ < 90°)"
    } else if a < 0.0 && b >= 0.0 {
        "Quadrant II (90° < θ ≤ 180°)"
    } else if a < 0.0 && b < 0.0 {
        "Quadrant III (-180° < θ < -90°)"
    } else if a > 0.0 && b < 0.0 {
        "Quadrant IV (-90° < θ < 0°)"
    } else if a == 0.0 && b > 0.0 {
        "แกนจินตภาพบวก (θ = 90°)"
    } else if a == 0.0 && b < 0.0 {
        "แกนจินตภาพลบ (θ = -90°)"
    } else {
        "จุดกำเนิด (Origin)"
    };
    format!("🧭 Step 4: จุด ({}, {}) อยู่ใน {}", a, b, quadrant)
}

// ============================================================
// Main: ตั้งค่า Router + CORS + Start Server
// ============================================================

#[tokio::main]
async fn main() {
    // ตั้งค่า CORS — อนุญาตให้ Frontend (localhost:5173) เข้าถึง
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    // สร้าง Router
    let app = Router::new()
        .route("/calculate", post(calculate))
        .layer(cors);

    // เริ่ม Server ที่ port 3000
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Rust Backend running at http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
