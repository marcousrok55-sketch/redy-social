import { query } from '../../config/database.js';
import logger from '../utils/logger.js';
import axios from 'axios';

// Get all website configurations
export const getWebsiteConfigs = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const result = await query(
      'SELECT * FROM website_configs WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    );
    res.json({ configs: result.rows });
  } catch (error) {
    logger.error('Get website configs error:', error);
    res.status(500).json({ error: 'Failed to get website configurations' });
  }
};

// Save website configuration
export const saveWebsiteConfig = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { name, platform, apiUrl, apiKey, authType, headers, isActive } = req.body;
    
    const result = await query(
      `INSERT INTO website_configs (workspace_id, name, platform, api_url, api_key, auth_type, headers, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (workspace_id, platform) 
       DO UPDATE SET name = $2, api_url = $4, api_key = $5, auth_type = $6, headers = $7, is_active = $8
       RETURNING *`,
      [workspaceId, name, platform, apiUrl, apiKey, authType || 'api_key', JSON.stringify(headers || {}), isActive ?? true]
    );
    
    logger.info(`Saved website config for ${platform} in workspace ${workspaceId}`);
    res.json({ config: result.rows[0] });
  } catch (error) {
    logger.error('Save website config error:', error);
    res.status(500).json({ error: 'Failed to save website configuration' });
  }
};

// Test website connection
export const testWebsiteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    
    const result = await query(
      'SELECT * FROM website_configs WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const config = result.rows[0];
    let headers = { ...config.headers };
    
    // Add auth header based on auth type
    if (config.auth_type === 'api_key') {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else if (config.auth_type === 'basic') {
      headers['Authorization'] = `Basic ${Buffer.from(config.api_key).toString('base64')}`;
    }
    
    // Test connection based on platform
    let testEndpoint = config.api_url;
    let method = 'GET';
    
    if (config.platform === 'wordpress') {
      testEndpoint = `${config.api_url.replace('/wp-json/wp/v2', '')}/wp-json/wp/v2/users/me`;
    } else if (config.platform === 'ghost') {
      testEndpoint = `${config.api_url}/ghost/api/admin/users/`;
    } else if (config.platform === 'strapi') {
      testEndpoint = `${config.api_url}/users/me`;
    }
    
    const response = await axios.get(testEndpoint, { headers, timeout: 10000 });
    
    res.json({ success: true, status: response.status, data: response.data });
  } catch (error: any) {
    logger.error('Test website connection error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Publish to website
export const publishToWebsite = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { configId, title, content, status, categories, tags, featuredMedia } = req.body;
    
    const result = await query(
      'SELECT * FROM website_configs WHERE id = $1 AND workspace_id = $2',
      [configId, workspaceId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const config = result.rows[0];
    let headers = { 'Content-Type': 'application/json', ...config.headers };
    
    if (config.auth_type === 'api_key') {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else if (config.auth_type === 'basic') {
      headers['Authorization'] = `Basic ${Buffer.from(config.api_key).toString('base64')}`;
    }
    
    let postData: any = {
      title,
      content,
      status: status || 'draft'
    };
    
    if (categories) postData.categories = categories;
    if (tags) postData.tags = tags;
    if (featuredMedia) postData.featured_media = featuredMedia;
    
    let publishEndpoint = `${config.api_url}`;
    
    if (config.platform === 'wordpress') {
      publishEndpoint = `${config.api_url}/posts`;
    } else if (config.platform === 'ghost') {
      publishEndpoint = `${config.api_url}/posts`;
      postData = { posts: [postData] };
    } else if (config.platform === 'strapi') {
      publishEndpoint = `${config.api_url}/articles`;
    }
    
    const response = await axios.post(publishEndpoint, postData, { headers, timeout: 30000 });
    
    logger.info(`Published to website ${config.name}`);
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    logger.error('Publish to website error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete website configuration
export const deleteWebsiteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    
    await query(
      'DELETE FROM website_configs WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );
    
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    logger.error('Delete website config error:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
};
