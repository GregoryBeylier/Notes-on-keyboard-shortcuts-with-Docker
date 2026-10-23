import { api, escapeHtml as e } from './api.js';

export function showForm(app, shortcut = null) {
  const isEdit = Boolean(shortcut);
  app.innerHTML = `
    <a class="back" href="#/">← Retour au sommaire</a>
    <p class="eyebrow">ENRICHIR LE CARNET</p>
    <h1>${isEdit ? 'Modifier la fiche' : 'Une astuce à partager ?'}</h1>
    <p class="intro">Remplissez les métadonnées, puis rédigez votre explication en Markdown. L’API créera le fichier pour vous.</p>
    <form id="shortcut-form" class="form">
      <div class="form-grid">
        <label>Titre<input name="title" required maxlength="120" value="${e(shortcut?.title ?? '')}" placeholder="Ouvrir la palette de commandes" /></label>
        <label>Touches<input name="keys" required maxlength="120" value="${e(shortcut?.keys ?? '')}" placeholder="Ctrl + Maj + P" /></label>
        <label>Catégorie<input name="category" required maxlength="60" value="${e(shortcut?.category ?? '')}" placeholder="VS Code, navigateur, terminal…" /></label>
        <label>Description courte<input name="description" required maxlength="300" value="${e(shortcut?.description ?? '')}" placeholder="Une phrase pour le sommaire" /></label>
      </div>
      <label>Contenu Markdown<textarea name="content" required rows="12" spellcheck="true" placeholder="## À quoi sert ce raccourci ?">${e(shortcut?.content ?? '')}</textarea></label>
      <p class="hint">Pour une image : <code>![Description de l’image](https://exemple.org/image.png)</code>. Pour un lien : <code>[Texte](https://exemple.org)</code>.</p>
      <p id="form-error" role="alert" class="error"></p>
      <button class="button" type="submit">${isEdit ? 'Enregistrer les modifications →' : 'Créer le fichier Markdown →'}</button>
    </form>`;

  const form = document.querySelector('#shortcut-form');
  const button = form.querySelector('button');
  const errorMessage = document.querySelector('#form-error');
  const keysInput = form.querySelector('input[name="keys"]');
  const labelIdle = isEdit ? 'Enregistrer les modifications →' : 'Créer le fichier Markdown →';

  keysInput.addEventListener('keydown', (event) => {
    // Ctrl+S enregistre quand même le formulaire
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!button.disabled) form.requestSubmit();
      return;
    }

    // Saisie normale : lettres, chiffres, Backspace, flèches... restent gérés par le champ
    if (!(event.ctrlKey || event.altKey || event.metaKey)) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return;

    // Combinaison avec modificateur : on la capture et on l'affiche
    event.preventDefault();
    event.stopPropagation(); // évite que les raccourcis de main.js se déclenchent

    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Maj');
    if (event.metaKey) modifiers.push('Win');

    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    keysInput.value = [...modifiers, key].join(' + ');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';
    button.disabled = true;
    button.textContent = isEdit ? 'Enregistrement…' : 'Création…';
    try {
      const data = Object.fromEntries(new FormData(form));
      const saved = await api(isEdit ? `/${encodeURIComponent(shortcut.slug)}` : '', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      location.hash = `/raccourci/${encodeURIComponent(saved.slug)}`;
    } catch (error) {
      errorMessage.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = labelIdle;
    }
  });
}