import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const API_URL = "http://localhost:3000";
const TOKEN_KEY = "goated_owner_token";

type Game = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url: string | null;
  platform_name: string | null;
  project_type_name: string | null;
  status_name: string | null;
  version: string | null;
  developer: string | null;
  original_release: string | null;
  localization_release: string | null;
  youtube_video_url: string | null;
  featured: boolean;
  published: boolean;
};

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [gameTitle, setGameTitle] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [gamePlatform, setGamePlatform] = useState("");
  const [gameType, setGameType] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [gameVersion, setGameVersion] = useState("");
  const [gameDeveloper, setGameDeveloper] = useState("");
  const [gameCover, setGameCover] = useState("");
  const [gameYoutube, setGameYoutube] = useState("");
  const [gameFeatured, setGameFeatured] = useState(false);
  const [gamePublished, setGamePublished] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionName, setVersionName] = useState("");
  const [versionNumber, setVersionNumber] = useState("");
  const [versionDescription, setVersionDescription] = useState("");
  const [versionReleaseDate, setVersionReleaseDate] = useState("");
  const [editingVersion, setEditingVersion] = useState<any | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل تسجيل الدخول");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function loadGames() {
    const response = await fetch(`${API_URL}/api/owner/games`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "تعذر تحميل الألعاب");
    }

    setGames(data.games);
  }

  useEffect(() => {
    if (!token) return;

    loadGames().catch((err) => {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    });
  }, [token]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setGames([]);
  }

  async function loadVersions(game: Game) {
    setError("");
    setSelectedGame(game);

    try {
      const response = await fetch(
        `${API_URL}/api/games/${game.slug}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل الإصدارات");
      }

      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }


  async function loadFiles(version: any) {
    setError("");
    setSelectedVersion(version);

    try {
      const response = await fetch(
        `${API_URL}/api/games/${selectedGame?.slug}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل الملفات");
      }

      setFiles(
        (data.files || []).filter(
          (file: any) => file.version_id === version.id,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  async function createFile(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedVersion) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/owner/versions/${selectedVersion.id}/files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: fileName,
            description: fileDescription,
            external_url: fileUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر إضافة الملف");
      }

      setFiles((current) => [data.file, ...current]);
      setFileName("");
      setFileDescription("");
      setFileUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  async function deleteFile(id: string) {
    if (!confirm("هل تريد حذف هذا الملف؟")) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/owner/files/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حذف الملف");
      }

      setFiles((current) => current.filter((file) => file.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }


  function editVersion(version: any) {
    setEditingVersion(version);
    setVersionName(version.name);
    setVersionNumber(version.version_number);
    setVersionDescription(version.description || "");
    setVersionReleaseDate(version.release_date || "");
  }

  async function deleteVersion(id: string) {
    if (!confirm("هل تريد حذف هذا الإصدار؟")) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/owner/versions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حذف الإصدار");
      }

      setVersions((current) =>
        current.filter((version) => version.id !== id),
      );

      if (selectedVersion?.id === id) {
        setSelectedVersion(null);
        setFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  async function createVersion(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedGame) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/owner/games/${selectedGame.id}/versions${editingVersion ? `/${editingVersion.id}` : ""}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: versionName,
            version_number: versionNumber,
            description: versionDescription,
            release_date: versionReleaseDate || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر إنشاء الإصدار");
      }

      if (editingVersion) {
        setVersions((current) =>
          current.map((version) =>
            version.id === editingVersion.id ? data.version : version,
          ),
        );
      } else {
        setVersions((current) => [data.version, ...current]);
      }

      setEditingVersion(null);
      setVersionName("");
      setVersionNumber("");
      setVersionDescription("");
      setVersionReleaseDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }


  function editGame(game: Game) {
    setEditingGame(game);
    setGameTitle(game.title);
    setGameSlug(game.slug);
    setGameDescription(game.description);
    setGamePlatform(game.platform_name || "");
    setGameType(game.project_type_name || "");
    setGameStatus(game.status_name || "");
    setGameVersion(game.version || "");
    setGameDeveloper(game.developer || "");
    setGameCover(game.cover_url || "");
    setGameYoutube(game.youtube_video_url || "");
    setGameFeatured(game.featured);
    setGamePublished(game.published);
    setShowForm(true);
  }

  async function deleteGame(id: string) {
    if (!confirm("هل تريد حذف هذه اللعبة؟")) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/owner/games/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حذف اللعبة");
      }

      setGames((current) => current.filter((game) => game.id !== id));

      if (selectedGame?.id === id) {
        setSelectedGame(null);
        setVersions([]);
        setSelectedVersion(null);
        setFiles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  async function createGame(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/owner/games`, {
        method: editingGame ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: gameSlug,
          title: gameTitle,
          description: gameDescription,
          cover_url: gameCover || undefined,
          platform_name: gamePlatform || undefined,
          project_type_name: gameType || undefined,
          status_name: gameStatus || undefined,
          version: gameVersion || undefined,
          developer: gameDeveloper || undefined,
          youtube_video_url: gameYoutube || undefined,
          featured: gameFeatured,
          published: gamePublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر إنشاء اللعبة");
      }

      if (editingGame) {
        setGames((current) =>
          current.map((game) =>
            game.id === editingGame.id ? data.game : game,
          ),
        );
      } else {
        setGames((current) => [data.game, ...current]);
      }

      setEditingGame(null);
      setShowForm(false);

      setGameTitle("");
      setGameSlug("");
      setGameDescription("");
      setGamePlatform("");
      setGameType("");
      setGameStatus("");
      setGameVersion("");
      setGameDeveloper("");
      setGameCover("");
      setGameYoutube("");
      setGameFeatured(false);
      setGamePublished(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    }
  }

  if (!token) {
    return (
      <main dir="rtl">
        <h1>Goated</h1>
        <h2>تسجيل دخول المالك</h2>

        <form onSubmit={login}>
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main dir="rtl">
      <header>
        <h1>Goated Owner Panel</h1>
        <button onClick={logout}>تسجيل الخروج</button>
      </header>

      <section>
        <h2>الألعاب</h2>

        <button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "إغلاق النموذج" : "+ إضافة لعبة"}
        </button>

        {showForm && (
          <form onSubmit={createGame}>
            <input
              placeholder="اسم اللعبة"
              value={gameTitle}
              onChange={(event) => setGameTitle(event.target.value)}
              required
            />

            <input
              placeholder="Slug مثل god-of-war-chains-of-olympus"
              value={gameSlug}
              onChange={(event) => setGameSlug(event.target.value)}
              required
            />

            <textarea
              placeholder="وصف اللعبة"
              value={gameDescription}
              onChange={(event) => setGameDescription(event.target.value)}
            />

            <input
              placeholder="المنصة"
              value={gamePlatform}
              onChange={(event) => setGamePlatform(event.target.value)}
            />

            <input
              placeholder="نوع المشروع"
              value={gameType}
              onChange={(event) => setGameType(event.target.value)}
            />

            <input
              placeholder="الحالة"
              value={gameStatus}
              onChange={(event) => setGameStatus(event.target.value)}
            />

            <input
              placeholder="الإصدار"
              value={gameVersion}
              onChange={(event) => setGameVersion(event.target.value)}
            />

            <input
              placeholder="المطور"
              value={gameDeveloper}
              onChange={(event) => setGameDeveloper(event.target.value)}
            />

            <input
              type="url"
              placeholder="رابط صورة الغلاف"
              value={gameCover}
              onChange={(event) => setGameCover(event.target.value)}
            />

            <input
              type="url"
              placeholder="رابط فيديو YouTube"
              value={gameYoutube}
              onChange={(event) => setGameYoutube(event.target.value)}
            />

            <label>
              <input
                type="checkbox"
                checked={gameFeatured}
                onChange={(event) => setGameFeatured(event.target.checked)}
              />
              لعبة مميزة
            </label>

            <label>
              <input
                type="checkbox"
                checked={gamePublished}
                onChange={(event) => setGamePublished(event.target.checked)}
              />
              نشر اللعبة
            </label>

            <button type="submit">
              {editingGame ? "حفظ التعديلات" : "حفظ اللعبة"}
            </button>
          </form>
        )}

        {error && <p>{error}</p>}

        {games.length === 0 ? (
          <p>لا توجد ألعاب حاليًا.</p>
        ) : (
          <div>
            {games.map((game) => (
              <article key={game.id}>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <p>المنصة: {game.platform_name || "—"}</p>
                <p>الإصدار: {game.version || "—"}</p>
                <p>
                  الحالة: {game.published ? "منشورة" : "مسودة"}
                </p>
                <p>
                  مميزة: {game.featured ? "نعم" : "لا"}
                </p>

                <button onClick={() => loadVersions(game)}>
                  الإصدارات
                </button>

                <button onClick={() => editGame(game)}>
                  تعديل
                </button>

                <button onClick={() => deleteGame(game.id)}>
                  حذف
                </button>
              </article>
            ))}
          </div>
        )}

      {selectedGame && (
        <section>
          <h2>إصدارات: {selectedGame.title}</h2>

          <form onSubmit={createVersion}>
            <input
              placeholder="اسم الإصدار"
              value={versionName}
              onChange={(event) => setVersionName(event.target.value)}
              required
            />

            <input
              placeholder="رقم الإصدار"
              value={versionNumber}
              onChange={(event) => setVersionNumber(event.target.value)}
              required
            />

            <textarea
              placeholder="وصف الإصدار"
              value={versionDescription}
              onChange={(event) => setVersionDescription(event.target.value)}
            />

            <input
              type="date"
              value={versionReleaseDate}
              onChange={(event) => setVersionReleaseDate(event.target.value)}
            />

            <button type="submit">
              {editingVersion ? "حفظ التعديلات" : "إضافة الإصدار"}
            </button>
          </form>

          {versions.length === 0 ? (
            <p>لا توجد إصدارات.</p>
          ) : (
            <div>
              {versions.map((version) => (
                <article key={version.id}>
                  <h3>{version.name}</h3>
                  <p>رقم الإصدار: {version.version_number}</p>
                  <p>{version.description}</p>
                  <p>
                    تاريخ الإصدار: {version.release_date || "—"}
                  </p>
                  <button onClick={() => loadFiles(version)}>
                    الملفات
                  </button>

                  <button onClick={() => editVersion(version)}>
                    تعديل
                  </button>

                  <button onClick={() => deleteVersion(version.id)}>
                    حذف
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}


      {selectedVersion && (
        <section>
          <h2>ملفات: {selectedVersion.name}</h2>

          <form onSubmit={createFile}>
            <input
              placeholder="اسم الملف"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              required
            />

            <input
              placeholder="وصف الملف"
              value={fileDescription}
              onChange={(event) => setFileDescription(event.target.value)}
            />

            <input
              type="url"
              placeholder="رابط التحميل"
              value={fileUrl}
              onChange={(event) => setFileUrl(event.target.value)}
              required
            />

            <button type="submit">إضافة الملف</button>
          </form>

          {files.length === 0 ? (
            <p>لا توجد ملفات.</p>
          ) : (
            <div>
              {files.map((file) => (
                <article key={file.id}>
                  <h3>{file.name}</h3>
                  <p>{file.description}</p>
                  <p>التنزيلات: {file.download_count}</p>
                  {file.external_url && (
                    <a
                      href={file.external_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      رابط MediaFire
                    </a>
                  )}

                  <button onClick={() => deleteFile(file.id)}>
                    حذف الملف
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
