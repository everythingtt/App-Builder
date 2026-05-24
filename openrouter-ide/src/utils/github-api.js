const GITHUB_API_BASE = 'https://api.github.com';
const APP_ID = '123456';

class GitHubAPI {
  constructor() {
    this.token = null;
    this.user = null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('github_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('github_token');
  }

  clearToken() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('github_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async getUser() {
    if (this.user) return this.user;
    this.user = await this.request('/user');
    return this.user;
  }

  async getInstallations() {
    return this.request('/app/installations');
  }

  async getInstallationToken(installationId) {
    const response = await fetch(`/api/github/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installation_id: installationId })
    });
    return response.json();
  }

  async saveFile(owner, repo, path, content, message, branch = 'main') {
    let sha;
    
    try {
      const existing = await this.request(`/repos/${owner}/${repo}/contents/${path}`);
      sha = existing.sha;
    } catch (e) {
    }

    const body = {
      message,
      content: btoa(content),
      branch
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async loadFile(owner, repo, path) {
    const data = await this.request(`/repos/${owner}/${repo}/contents/${path}`);
    return atob(data.content);
  }

  async saveIDESate(owner, repo, state, branch = 'main') {
    const user = await this.getUser();
    const path = `users/${user.login}/ide-state.json`;
    const content = JSON.stringify(state, null, 2);
    
    return this.saveFile(owner, repo, path, content, 'Save IDE state', branch);
  }

  async loadIDEState(owner, repo, branch = 'main') {
    const user = await this.getUser();
    const path = `users/${user.login}/ide-state.json`;
    const content = await this.loadFile(owner, repo, path);
    
    return JSON.parse(content);
  }

  async createBranch(owner, repo, branchName, fromBranch = 'main') {
    const source = await this.request(`/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
    
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: source.object.sha
      })
    });
  }

  async createPullRequest(owner, repo, title, head, base = 'main', body = '') {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        head,
        base,
        body
      })
    });
  }

  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  async listBranches(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/branches`);
  }

  async getCommitHistory(owner, repo, path, branch = 'main') {
    return this.request(`/repos/${owner}/${repo}/commits?path=${path}&sha=${branch}`);
  }
}

const githubAPI = new GitHubAPI();

export { GitHubAPI, githubAPI };

export async function saveProject(state) {
  try {
    await githubAPI.saveIDESate('everythingtt', 'App-Builder', {
      files: Array.from(state.files.entries()),
      directoryMap: Array.from(state.directoryMap.entries()),
      messages: state.messages,
      tokenBalance: state.tokenBalance,
      selectedModel: state.selectedModel
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loadProject() {
  try {
    const state = await githubAPI.loadIDEState('everythingtt', 'App-Builder');
    return { success: true, data: state };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function authenticateWithCode(code) {
  try {
    const response = await fetch('/api/github/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await response.json();
    
    if (data.access_token) {
      githubAPI.setToken(data.access_token);
      return { success: true, token: data.access_token };
    }
    
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function isAuthenticated() {
  return !!githubAPI.getToken();
}

export function logout() {
  githubAPI.clearToken();
}
