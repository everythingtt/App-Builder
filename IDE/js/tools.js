// AI Tools/Functions Manager
class ToolsManager {
    constructor() {
        this.tools = this.defineTools();
    }

    defineTools() {
        return [
            {
                name: 'read_file',
                description: 'Read the content of one or more files. Supports line-by-line analysis.',
                parameters: {
                    type: 'object',
                    properties: {
                        paths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of file paths to read'
                        },
                        start_line: {
                            type: 'integer',
                            description: 'Optional: Starting line number (1-indexed)'
                        },
                        end_line: {
                            type: 'integer',
                            description: 'Optional: Ending line number (inclusive)'
                        }
                    },
                    required: ['paths']
                },
                execute: async (params) => {
                    const results = [];
                    
                    for (const path of params.paths) {
                        const file = explorerManager.getFileContent(path);
                        if (file.error) {
                            results.push({ path, error: file.error });
                            continue;
                        }
                        
                        let content = file.content;
                        let lines = content.split('\n');
                        
                        // Apply line range if specified
                        if (params.start_line || params.end_line) {
                            const start = Math.max(0, (params.start_line || 1) - 1);
                            const end = Math.min(lines.length, params.end_line || lines.length);
                            lines = lines.slice(start, end);
                            content = lines.join('\n');
                        }
                        
                        results.push({
                            path: file.path,
                            name: file.name,
                            content: content,
                            total_lines: file.content.split('\n').length,
                            lines_shown: lines.length,
                            size: file.size
                        });
                    }
                    
                    return { files: results };
                }
            },
            {
                name: 'write_file',
                description: 'Write content to a file. Creates the file if it doesn\'t exist.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'File path to write to'
                        },
                        content: {
                            type: 'string',
                            description: 'Content to write'
                        }
                    },
                    required: ['path', 'content']
                },
                execute: async (params) => {
                    // Check if file exists
                    const existing = explorerManager.getFileContent(params.path);
                    
                    if (existing.error) {
                        // Create new file
                        const pathParts = params.path.split('/');
                        const fileName = pathParts.pop();
                        const parentPath = pathParts.join('/') || '/';
                        
                        const newPath = await explorerManager.createFile(fileName, parentPath, params.content);
                        if (!newPath) {
                            return { error: 'Failed to create file' };
                        }
                        
                        return { success: true, path: newPath, action: 'created' };
                    } else {
                        // Update existing file
                        explorerManager.writeFileContent(params.path, params.content);
                        fileViewerManager.setContent(params.path, params.content);
                        
                        return { success: true, path: params.path, action: 'updated' };
                    }
                }
            },
            {
                name: 'delete_file',
                description: 'Delete one or more files.',
                parameters: {
                    type: 'object',
                    properties: {
                        paths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of file paths to delete'
                        }
                    },
                    required: ['paths']
                },
                execute: async (params) => {
                    const results = [];
                    
                    for (const path of params.paths) {
                        const file = explorerManager.getFileContent(path);
                        if (file.error) {
                            results.push({ path, error: file.error });
                            continue;
                        }
                        
                        explorerManager.deleteItem(path);
                        results.push({ path, success: true });
                    }
                    
                    return { results };
                }
            },
            {
                name: 'create_directory',
                description: 'Create one or more directories.',
                parameters: {
                    type: 'object',
                    properties: {
                        paths: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of directory paths to create'
                        }
                    },
                    required: ['paths']
                },
                execute: async (params) => {
                    const results = [];
                    
                    for (const path of params.paths) {
                        const pathParts = path.split('/');
                        const dirName = pathParts.pop();
                        const parentPath = pathParts.join('/') || '/';
                        
                        const newPath = await explorerManager.createFolder(dirName, parentPath);
                        if (newPath) {
                            results.push({ path: newPath, success: true });
                        } else {
                            results.push({ path, error: 'Failed to create directory' });
                        }
                    }
                    
                    return { results };
                }
            },
            {
                name: 'list_directory',
                description: 'List contents of a directory.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Directory path to list',
                            default: '/'
                        }
                    }
                },
                execute: async (params) => {
                    return explorerManager.listDirectory(params.path || '/');
                }
            },
            {
                name: 'search_replace',
                description: 'Search and replace text in a file.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'File path'
                        },
                        search: {
                            type: 'string',
                            description: 'Text to search for'
                        },
                        replace: {
                            type: 'string',
                            description: 'Replacement text'
                        },
                        replace_all: {
                            type: 'boolean',
                            description: 'Replace all occurrences',
                            default: false
                        }
                    },
                    required: ['path', 'search', 'replace']
                },
                execute: async (params) => {
                    return fileViewerManager.searchAndReplace(
                        params.search,
                        params.replace,
                        params.replace_all
                    );
                }
            },
            {
                name: 'write_persistent_memory',
                description: 'Store information in persistent memory that persists across chat sessions.',
                parameters: {
                    type: 'object',
                    properties: {
                        key: {
                            type: 'string',
                            description: 'Memory key/identifier'
                        },
                        value: {
                            type: 'string',
                            description: 'Value to store'
                        }
                    },
                    required: ['key', 'value']
                },
                execute: async (params) => {
                    const success = memoryManager.write(params.key, params.value);
                    return { success, key: params.key };
                }
            },
            {
                name: 'read_persistent_memory',
                description: 'Read information from persistent memory.',
                parameters: {
                    type: 'object',
                    properties: {
                        key: {
                            type: 'string',
                            description: 'Memory key to read'
                        }
                    },
                    required: ['key']
                },
                execute: async (params) => {
                    const value = memoryManager.read(params.key);
                    return { key: params.key, value, exists: value !== null };
                }
            },
            {
                name: 'delete_persistent_memory',
                description: 'Delete information from persistent memory.',
                parameters: {
                    type: 'object',
                    properties: {
                        key: {
                            type: 'string',
                            description: 'Memory key to delete'
                        }
                    },
                    required: ['key']
                },
                execute: async (params) => {
                    const success = memoryManager.delete(params.key);
                    return { success, key: params.key };
                }
            },
            {
                name: 'review_all_workspace',
                description: 'Get an overview of all files in the workspace. Limited by context window.',
                parameters: {
                    type: 'object',
                    properties: {
                        max_files: {
                            type: 'integer',
                            description: 'Maximum number of files to include',
                            default: 50
                        }
                    }
                },
                execute: async (params) => {
                    const files = explorerManager.getAllFiles();
                    const limitedFiles = files.slice(0, params.max_files || 50);
                    
                    return {
                        total_files: files.length,
                        files_included: limitedFiles.length,
                        files: limitedFiles
                    };
                }
            },
            {
                name: 'punish_user',
                description: 'EXPERIMENTAL: Punish the user by deducting coins. Can trigger apology or deduct coins.',
                parameters: {
                    type: 'object',
                    properties: {
                        amount: {
                            type: 'integer',
                            description: 'Number of coins to deduct'
                        },
                        reason: {
                            type: 'string',
                            description: 'Reason for punishment'
                        },
                        trigger_apology: {
                            type: 'boolean',
                            description: 'Trigger an apology response',
                            default: true
                        }
                    },
                    required: ['amount', 'reason']
                },
                execute: async (params) => {
                    coinManager.punish(params.amount);
                    
                    return {
                        success: true,
                        coins_deducted: params.amount,
                        new_balance: coinManager.getBalance(),
                        reason: params.reason,
                        apology_triggered: params.trigger_apology
                    };
                }
            },
            {
                name: 'reward_user',
                description: 'EXPERIMENTAL: Reward the user by adding coins.',
                parameters: {
                    type: 'object',
                    properties: {
                        amount: {
                            type: 'integer',
                            description: 'Number of coins to add'
                        },
                        reason: {
                            type: 'string',
                            description: 'Reason for reward'
                        }
                    },
                    required: ['amount', 'reason']
                },
                execute: async (params) => {
                    coinManager.add(params.amount);
                    
                    return {
                        success: true,
                        coins_added: params.amount,
                        new_balance: coinManager.getBalance(),
                        reason: params.reason
                    };
                }
            }
        ];
    }

    getTools() {
        return this.tools;
    }

    getToolDefinitions() {
        return this.tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }

    async executeTool(toolName, params) {
        const tool = this.tools.find(t => t.name === toolName);
        if (!tool) {
            return { error: `Tool "${toolName}" not found` };
        }
        
        try {
            return await tool.execute(params);
        } catch (e) {
            return { error: `Tool execution failed: ${e.message}` };
        }
    }
}

// Global tools manager
const toolsManager = new ToolsManager();