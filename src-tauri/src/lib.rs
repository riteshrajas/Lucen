// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstalledApp {
    pub name: String,
    pub display_name: String,
    pub path: Option<String>,
    pub version: Option<String>,
    pub publisher: Option<String>,
    pub install_date: Option<String>,
    pub icon_path: Option<String>,
    pub category: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    println!("🔍 Starting to scan for installed applications...");
    
    let mut apps = Vec::new();
    
    // Get apps from Windows Registry (Programs and Features)
    if let Ok(registry_apps) = get_apps_from_registry().await {
        println!("📋 Found {} apps from registry", registry_apps.len());
        apps.extend(registry_apps);
    }
    
    // Get apps from common installation directories
    if let Ok(directory_apps) = get_apps_from_directories().await {
        println!("📁 Found {} apps from directories", directory_apps.len());
        apps.extend(directory_apps);
    }
    
    // Remove duplicates and sort
    apps.sort_by(|a, b| a.display_name.to_lowercase().cmp(&b.display_name.to_lowercase()));
    apps.dedup_by(|a, b| a.name == b.name);
    
    println!("✅ Found {} total applications", apps.len());
    Ok(apps)
}

#[tauri::command]
async fn scan_running_processes() -> Result<Vec<String>, String> {
    println!("🔄 Scanning for currently running processes...");
    // This would scan for currently running processes
    // For now, return a simple list
    let processes = vec![
        "chrome.exe".to_string(),
        "firefox.exe".to_string(),
        "notepad.exe".to_string(),
        "code.exe".to_string(),
    ];
    println!("📊 Found {} running processes (mock data)", processes.len());
    Ok(processes)
}

async fn get_apps_from_registry() -> Result<Vec<InstalledApp>, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let mut apps = Vec::new();
    
    // Check both 32-bit and 64-bit registry locations
    let registry_paths = vec![
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    ];
    
    for path in registry_paths {
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(path) {
            for subkey_name in hklm.enum_keys().filter_map(|x| x.ok()) {
                if let Ok(subkey) = hklm.open_subkey(&subkey_name) {
                    let display_name: Result<String, _> = subkey.get_value("DisplayName");
                    let install_location: Result<String, _> = subkey.get_value("InstallLocation");
                    let version: Result<String, _> = subkey.get_value("DisplayVersion");
                    let publisher: Result<String, _> = subkey.get_value("Publisher");
                    let install_date: Result<String, _> = subkey.get_value("InstallDate");
                    let icon: Result<String, _> = subkey.get_value("DisplayIcon");
                    
                    if let Ok(name) = display_name {
                        // Filter out system components and updates
                        if !name.contains("Update") && 
                           !name.contains("Hotfix") && 
                           !name.contains("Security Update") &&
                           !name.starts_with("Microsoft Visual C++") &&
                           name.len() > 2 {
                            
                            let category = categorize_app(&name);
                            
                            apps.push(InstalledApp {
                                name: subkey_name.clone(),
                                display_name: name,
                                path: install_location.ok(),
                                version: version.ok(),
                                publisher: publisher.ok(),
                                install_date: install_date.ok(),
                                icon_path: icon.ok(),
                                category,
                            });
                        }
                    }
                }
            }
        }
    }
    
    Ok(apps)
}

async fn get_apps_from_directories() -> Result<Vec<InstalledApp>, String> {
    let mut apps = Vec::new();
    
    // Common installation directories
    let common_dirs = vec![
        r"C:\Program Files",
        r"C:\Program Files (x86)",
        r"C:\Users\Public\Desktop",
    ];
    
    for dir in common_dirs {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.filter_map(|e| e.ok()) {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_dir() {
                        if let Some(name) = entry.file_name().to_str() {
                            // Look for executable files in the directory
                            if let Ok(exe_path) = find_main_executable(&entry.path()) {
                                let category = categorize_app(name);
                                
                                apps.push(InstalledApp {
                                    name: name.to_string(),
                                    display_name: name.to_string(),
                                    path: Some(exe_path),
                                    version: None,
                                    publisher: None,
                                    install_date: None,
                                    icon_path: None,
                                    category,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(apps)
}

fn find_main_executable(dir: &Path) -> Result<String, String> {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".exe") && !name.contains("uninstall") && !name.contains("setup") {
                    return Ok(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }
    Err("No executable found".to_string())
}

fn categorize_app(name: &str) -> String {
    let name_lower = name.to_lowercase();
    
    // Gaming applications
    if name_lower.contains("game") || 
       name_lower.contains("steam") || 
       name_lower.contains("epic") ||
       name_lower.contains("origin") ||
       name_lower.contains("uplay") ||
       name_lower.contains("battle.net") {
        return "Gaming".to_string();
    }
    
    // Social media and communication
    if name_lower.contains("discord") || 
       name_lower.contains("slack") || 
       name_lower.contains("teams") ||
       name_lower.contains("zoom") ||
       name_lower.contains("skype") ||
       name_lower.contains("whatsapp") ||
       name_lower.contains("telegram") {
        return "Communication".to_string();
    }
    
    // Entertainment
    if name_lower.contains("spotify") || 
       name_lower.contains("netflix") || 
       name_lower.contains("youtube") ||
       name_lower.contains("vlc") ||
       name_lower.contains("media") ||
       name_lower.contains("video") ||
       name_lower.contains("music") {
        return "Entertainment".to_string();
    }
    
    // Web browsers
    if name_lower.contains("chrome") || 
       name_lower.contains("firefox") || 
       name_lower.contains("edge") ||
       name_lower.contains("safari") ||
       name_lower.contains("opera") ||
       name_lower.contains("browser") {
        return "Web Browser".to_string();
    }
    
    // Development tools
    if name_lower.contains("visual studio") || 
       name_lower.contains("code") || 
       name_lower.contains("git") ||
       name_lower.contains("node") ||
       name_lower.contains("python") ||
       name_lower.contains("developer") ||
       name_lower.contains("programming") {
        return "Development".to_string();
    }
    
    // Productivity
    if name_lower.contains("office") || 
       name_lower.contains("word") || 
       name_lower.contains("excel") ||
       name_lower.contains("powerpoint") ||
       name_lower.contains("outlook") ||
       name_lower.contains("notepad") ||
       name_lower.contains("calculator") {
        return "Productivity".to_string();
    }
    
    // Default category
    "Other".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_installed_apps, 
            scan_running_processes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
