import React from 'react';

const DeleteModal = ({ 
  show, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName,
  itemDetails,
  itemImage,
  loading = false,
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {title}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <i className="fas fa-trash-alt text-danger fa-3x mb-3"></i>
              <h6>{message}</h6>
            </div>
            
            {/* Item Preview */}
            {(itemName || itemDetails || itemImage) && (
              <div className="card border-danger">
                <div className="card-body">
                  <div className="row">
                    {itemImage && (
                      <div className="col-md-3 text-center">
                        <img 
                          src={itemImage} 
                          alt={itemName || "Item"}
                          className="img-fluid rounded"
                          style={{maxHeight: '80px', width: 'auto'}}
                        />
                      </div>
                    )}
                    <div className={itemImage ? "col-md-9" : "col-12"}>
                      {itemName && (
                        <h6 className="fw-bold text-danger">{itemName}</h6>
                      )}
                      {itemDetails && (
                        <div className="text-muted">
                          {itemDetails}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="alert alert-warning mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone.
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times me-1"></i>
              {cancelText}
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash me-1"></i>
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
