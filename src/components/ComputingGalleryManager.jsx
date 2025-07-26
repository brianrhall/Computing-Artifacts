xt IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF, WebP (max 5MB per file)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Sticky Footer */}
              <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className={`w-full sm:w-auto px-4 py-2 ${
                      uploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    {uploading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingId ? 'Update' : 'Save'} Artifact
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputingGalleryManager;