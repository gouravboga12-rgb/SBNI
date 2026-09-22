import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Navigation,
  Camera,
  CheckCircle2,
  XCircle,
  Phone,
  Building,
  Store,
  MapPin,
  Calendar,
  ShieldCheck,
  CreditCard,
} from 'lucide-react-native';
import { VendorLead } from '../types';
import { updateLeadStatusApi, deleteLenderLeadApi } from '../services/api';
import { DocumentViewerModal } from './DocumentViewerModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VendorReviewModalProps {
  visible: boolean;
  onClose: () => void;
  vendor: VendorLead | null;
  onStatusChange?: (vendorId: string, newStatus: string) => void;
  onDeleteRequest?: (vendorId: string) => void;
  onReportFraud?: (vendor: VendorLead) => void;
}

export const VendorReviewModal: React.FC<VendorReviewModalProps> = ({
  visible,
  onClose,
  vendor,
  onStatusChange,
  onDeleteRequest,
  onReportFraud,
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(vendor?.status || 'Pending');
  const [docViewerModal, setDocViewerModal] = useState<{
    visible: boolean;
    title: string;
    url: string | null;
    fileName?: string;
  }>({
    visible: false,
    title: '',
    url: null,
  });
  const [actionFeedback, setActionFeedback] = useState<string>('');

  React.useEffect(() => {
    if (vendor) {
      setCurrentStatus(vendor.status);
    }
  }, [vendor]);

  if (!visible || !vendor) return null;

  const isFraud = !!vendor.isFraud;
  const isAccepted = currentStatus === 'Accepted' || currentStatus === 'Verified';
  const isRejected = currentStatus === 'Rejected';

  const handleApprove = async () => {
    if (isFraud) {
      Alert.alert('Cannot Approve', 'Cannot accept account marked as FRAUD by Admin!');
      return;
    }
    setCurrentStatus('Accepted');
    setActionFeedback('✅ Financing Request Accepted! Vendor can now navigate to your office on Google Maps.');
    if (onStatusChange) onStatusChange(vendor.id, 'Accepted');
    await updateLeadStatusApi(vendor.id, 'Accepted');
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleReject = async () => {
    setCurrentStatus('Rejected');
    setActionFeedback('❌ Financing Request Rejected.');
    if (onStatusChange) onStatusChange(vendor.id, 'Rejected');
    await updateLeadStatusApi(vendor.id, 'Rejected');
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      `Are you sure you want to delete the financing request from ${vendor.vendorName} (${vendor.shopName})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (onDeleteRequest) onDeleteRequest(vendor.id);
            await deleteLenderLeadApi(vendor.id);
            onClose();
          },
        },
      ]
    );
  };

  const resolveDocUrl = (uri: string | null | undefined): string | null => {
    if (!uri || typeof uri !== 'string') return null;
    const trimmed = uri.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file://') ||
      trimmed.startsWith('content://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }
    const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return `https://justpaisa.in/${clean}`;
  };

  const openGoogleMaps = () => {
    try {
      const lat = vendor.latitude || 17.3688;
      const lng = vendor.longitude || 78.5247;
      const label = encodeURIComponent(`${vendor.shopName || 'Shop'} (${vendor.vendorName || 'Vendor'})`);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
      Linking.openURL(url).catch(() => {});
    } catch (e) {
      console.warn('Map open error:', e);
    }
  };

  const handleCall = () => {
    try {
      if (vendor.mobileNumber && vendor.mobileNumber !== 'Not provided') {
        Linking.openURL(`tel:${vendor.mobileNumber}`).catch(() => {});
      } else {
        Alert.alert('Notice', 'Mobile number not provided.');
      }
    } catch (e) {
      console.warn('Call error:', e);
    }
  };

  // Collect shop photos
  const premisesPhotos: { title: string; url: string }[] = [];
  if (Array.isArray(vendor.shopPhotos) && vendor.shopPhotos.length > 0) {
    vendor.shopPhotos.forEach((p, idx) => {
      const resUrl = resolveDocUrl(p);
      if (resUrl) {
        premisesPhotos.push({ title: `Storefront / Premises ${idx + 1}`, url: resUrl });
      }
    });
  }
  if (Array.isArray(vendor.shopImages) && vendor.shopImages.length > 0) {
    vendor.shopImages.forEach((img, idx) => {
      const resUrl = resolveDocUrl(img);
      if (resUrl && !premisesPhotos.some((p) => p.url === resUrl)) {
        premisesPhotos.push({ title: `Shop Photo ${idx + 1}`, url: resUrl });
      }
    });
  }
  const mainShopPhoto = resolveDocUrl(vendor.shopPhotoUrl);
  if (mainShopPhoto && !premisesPhotos.some((p) => p.url === mainShopPhoto)) {
    premisesPhotos.push({ title: 'Shop Front Photo', url: mainShopPhoto });
  }

  const resolvedPan = resolveDocUrl(vendor.panFileUrl);
  const resolvedAadhaar = resolveDocUrl(vendor.aadhaarFileUrl);
  const resolvedLicense = resolveDocUrl(vendor.shopLicensePdf);
  const resolvedGst = resolveDocUrl(vendor.gstCertificatePdf);
  const resolvedAvatar = resolveDocUrl(vendor.avatarUrl || vendor.liveSelfieUrl);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.topLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <ArrowLeft size={20} color="#0f172a" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Shop Business Verification</Text>
              <Text style={styles.subTitle}>Review shop details and documents for approval</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {onReportFraud && !isFraud && (
              <TouchableOpacity
                style={styles.fraudReportHeaderBtn}
                onPress={() => onReportFraud(vendor)}
              >
                <AlertTriangle size={14} color="#dc2626" />
                <Text style={styles.fraudReportHeaderBtnText}>Report Fraud</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 size={16} color="#dc2626" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Action Feedback Banner */}
          {actionFeedback ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackBannerText}>{actionFeedback}</Text>
            </View>
          ) : null}

          {/* Fraud Warning Alert Banner */}
          {isFraud && (
            <View style={styles.fraudBanner}>
              <AlertTriangle size={32} color="#fef08a" style={{ flexShrink: 0 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fraudBannerTitle}>🚨 FRAUD ACCOUNT ALERT (FLAGGED BY ADMIN)</Text>
                <Text style={styles.fraudBannerDesc}>
                  This vendor account ({vendor.vendorName} - {vendor.shopName}) has been reported and marked as a FRAUD ACCOUNT by JustPaisa Admin. Do not approve credit or disburse funds!
                </Text>
              </View>
            </View>
          )}

          {/* Vendor Profile Header Summary Card */}
          <View style={styles.cardWhite}>
            <View style={styles.vendorHeaderRow}>
              <View style={styles.avatarBox}>
                {vendor.avatarUrl || vendor.liveSelfieUrl ? (
                  <Image
                    source={{ uri: vendor.avatarUrl || vendor.liveSelfieUrl }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {vendor.vendorName?.charAt(0).toUpperCase() || 'V'}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorName}>{vendor.vendorName}</Text>
                <Text style={styles.shopNameText}>{vendor.shopName}</Text>
                <Text style={styles.addressSubText} numberOfLines={2}>{vendor.shopAddress}</Text>
                <Text style={styles.dateSubText}>Requested on {vendor.requestedDate} {vendor.requestedTime || ''}</Text>
              </View>
              <View>
                {isFraud ? (
                  <View style={styles.badgeFraud}>
                    <Text style={styles.badgeFraudText}>🚨 FRAUD</Text>
                  </View>
                ) : (
                  <View style={[styles.badgeStatus, isAccepted ? styles.badgeGreen : isRejected ? styles.badgeRed : styles.badgeAmber]}>
                    <Text style={[styles.badgeStatusText, isAccepted ? { color: '#16a34a' } : isRejected ? { color: '#dc2626' } : { color: '#d97706' }]}>
                      {currentStatus}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Annual Income / Turnover Card */}
          <View style={styles.incomeCard}>
            <Text style={styles.incomeLabel}>ANNUAL INCOME / TURNOVER</Text>
            <Text style={styles.incomeVal}>
              {vendor.annualIncome || vendor.annualTurnover || (vendor.monthlyIncome ? `₹${vendor.monthlyIncome}` : 'Under 2 Lakhs')}
            </Text>
            {vendor.bankAccountDetails && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank Details:</Text>
                <Text style={styles.bankVal}>{vendor.bankAccountDetails}</Text>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.cardWhite}>
            <Text style={styles.sectionHeading}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoVal}>{vendor.vendorName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.infoVal}>{vendor.mobileNumber}</Text>
                <TouchableOpacity style={styles.callSmallBtn} onPress={handleCall}>
                  <Phone size={12} color="#ffffff" />
                  <Text style={styles.callSmallBtnText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email ID</Text>
              <Text style={styles.infoVal}>{vendor.emailId || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shop Address</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>{vendor.shopAddress || 'Pending'}</Text>
            </View>
          </View>

          {/* Identity Documents */}
          <View style={styles.cardWhite}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Identity Documents</Text>
              <Text style={styles.compliancePill}>Mandatory Review</Text>
            </View>

            {/* PAN Card Card */}
            <View style={styles.docBox}>
              <View style={styles.docBoxHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} color="#003893" />
                    <Text style={styles.docName}>PAN Card</Text>
                  </View>
                  <Text style={styles.docNumber}>{vendor.panNumber || 'No PAN Number Provided'}</Text>
                </View>
                <View style={[styles.docBadge, vendor.panFileUrl ? styles.docBadgeGreen : styles.docBadgeAmber]}>
                  <Text style={[styles.docBadgeText, vendor.panFileUrl ? { color: '#16a34a' } : { color: '#d97706' }]}>
                    {vendor.panFileUrl ? 'File Uploaded' : vendor.panNumber ? 'Number Provided' : 'Not Provided'}
                  </Text>
                </View>
              </View>
              {vendor.panFileUrl ? (
                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDocBtn}
                    onPress={() =>
                      setDocViewerModal({
                        visible: true,
                        title: `PAN Card (${vendor.panNumber || vendor.vendorName})`,
                        url: vendor.panFileUrl!,
                        fileName: `PAN_${vendor.panNumber || 'Card'}`,
                      })
                    }
                  >
                    <Eye size={14} color="#ffffff" />
                    <Text style={styles.viewDocBtnText}>View & Inspect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadDocBtn}
                    onPress={() => Linking.openURL(vendor.panFileUrl!).catch(() => {})}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.downloadDocBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Aadhaar Card Card */}
            <View style={styles.docBox}>
              <View style={styles.docBoxHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} color="#003893" />
                    <Text style={styles.docName}>Aadhaar Card</Text>
                  </View>
                  <Text style={styles.docNumber}>{vendor.aadhaarNumber || 'No Aadhaar Number Provided'}</Text>
                </View>
                <View style={[styles.docBadge, vendor.aadhaarFileUrl ? styles.docBadgeGreen : styles.docBadgeAmber]}>
                  <Text style={[styles.docBadgeText, vendor.aadhaarFileUrl ? { color: '#16a34a' } : { color: '#d97706' }]}>
                    {vendor.aadhaarFileUrl ? 'File Uploaded' : vendor.aadhaarNumber ? 'Number Provided' : 'Not Provided'}
                  </Text>
                </View>
              </View>
              {vendor.aadhaarFileUrl ? (
                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDocBtn}
                    onPress={() =>
                      setDocViewerModal({
                        visible: true,
                        title: `Aadhaar Card (${vendor.aadhaarNumber || vendor.vendorName})`,
                        url: vendor.aadhaarFileUrl!,
                        fileName: `Aadhaar_${vendor.aadhaarNumber || 'Card'}`,
                      })
                    }
                  >
                    <Eye size={14} color="#ffffff" />
                    <Text style={styles.viewDocBtnText}>View & Inspect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadDocBtn}
                    onPress={() => Linking.openURL(vendor.aadhaarFileUrl!).catch(() => {})}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.downloadDocBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>

          {/* Shop Information & Location */}
          <View style={styles.cardWhite}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Shop Information & Location</Text>
              <TouchableOpacity style={styles.navMapsBtn} onPress={openGoogleMaps}>
                <Navigation size={12} color="#ffffff" />
                <Text style={styles.navMapsBtnText}>🧭 Google Maps</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shop Name</Text>
              <Text style={styles.infoVal}>{vendor.shopName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Address</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>{vendor.shopAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City / State</Text>
              <Text style={styles.infoVal}>{vendor.city}, {vendor.state}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shop Type</Text>
              <Text style={styles.infoVal}>{vendor.shopType || 'Retail & Small Business'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Years in Business</Text>
              <Text style={styles.infoVal}>{vendor.yearsInBusiness || 'Established'}</Text>
            </View>
          </View>

          {/* Shop Photos & Premises */}
          <View style={styles.cardWhite}>
            <Text style={styles.sectionHeading}>Shop Photos & Premises</Text>
            {premisesPhotos.length > 0 ? (
              <View style={styles.photosGrid}>
                {premisesPhotos.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.photoThumbContainer}
                    onPress={() =>
                      setDocViewerModal({
                        visible: true,
                        title: p.title,
                        url: p.url,
                      })
                    }
                  >
                    <Image source={{ uri: p.url }} style={styles.photoThumb} />
                    <View style={styles.photoOverlay}>
                      <Text style={styles.photoTitle} numberOfLines={1}>{p.title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPhotosBox}>
                <Camera size={28} color="#94a3b8" />
                <Text style={styles.emptyPhotosText}>No storefront photos uploaded by vendor</Text>
              </View>
            )}
          </View>

          {/* Additional Business Documents */}
          <View style={styles.cardWhite}>
            <Text style={styles.sectionHeading}>Additional Business Documents</Text>

            {/* Business License */}
            <View style={styles.docBox}>
              <View style={styles.docBoxHeader}>
                <View>
                  <Text style={styles.docName}>Business / Trade License</Text>
                  <Text style={styles.docSub}>{vendor.shopLicensePdf ? 'Document Attached' : 'Not Uploaded'}</Text>
                </View>
                <View style={[styles.docBadge, vendor.shopLicensePdf ? styles.docBadgeGreen : styles.docBadgeGray]}>
                  <Text style={[styles.docBadgeText, vendor.shopLicensePdf ? { color: '#16a34a' } : { color: '#64748b' }]}>
                    {vendor.shopLicensePdf ? 'Uploaded' : 'Optional'}
                  </Text>
                </View>
              </View>
              {vendor.shopLicensePdf && (
                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDocBtn}
                    onPress={() =>
                      setDocViewerModal({
                        visible: true,
                        title: `Business License (${vendor.shopName})`,
                        url: vendor.shopLicensePdf!,
                      })
                    }
                  >
                    <Eye size={14} color="#ffffff" />
                    <Text style={styles.viewDocBtnText}>View License</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadDocBtn}
                    onPress={() => Linking.openURL(vendor.shopLicensePdf!).catch(() => {})}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.downloadDocBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* GST Certificate */}
            <View style={styles.docBox}>
              <View style={styles.docBoxHeader}>
                <View>
                  <Text style={styles.docName}>GST Certificate</Text>
                  <Text style={styles.docSub}>{vendor.gstNumber ? `GSTIN: ${vendor.gstNumber}` : 'Not provided'}</Text>
                </View>
                <View style={[styles.docBadge, vendor.gstCertificatePdf ? styles.docBadgeGreen : styles.docBadgeGray]}>
                  <Text style={[styles.docBadgeText, vendor.gstCertificatePdf ? { color: '#16a34a' } : { color: '#64748b' }]}>
                    {vendor.gstCertificatePdf ? 'Uploaded' : 'Optional'}
                  </Text>
                </View>
              </View>
              {vendor.gstCertificatePdf && (
                <View style={styles.docActionsRow}>
                  <TouchableOpacity
                    style={styles.viewDocBtn}
                    onPress={() =>
                      setDocViewerModal({
                        visible: true,
                        title: `GST Certificate (${vendor.shopName})`,
                        url: vendor.gstCertificatePdf!,
                      })
                    }
                  >
                    <Eye size={14} color="#ffffff" />
                    <Text style={styles.viewDocBtnText}>View GST</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadDocBtn}
                    onPress={() => Linking.openURL(vendor.gstCertificatePdf!).catch(() => {})}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.downloadDocBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {isAccepted ? (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                  <XCircle size={16} color="#dc2626" />
                  <Text style={styles.rejectBtnText}>Reject Request</Text>
                </TouchableOpacity>

                <View style={styles.acceptedBannerBtn}>
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text style={styles.acceptedBannerBtnText}>✓ Request Accepted</Text>
                </View>
              </View>
            ) : (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
                  <XCircle size={16} color="#dc2626" />
                  <Text style={styles.rejectBtnText}>Reject Request</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.approveBtn, isFraud && styles.disabledBtn]}
                  onPress={handleApprove}
                  disabled={isFraud}
                >
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text style={styles.approveBtnText}>
                    {isFraud ? 'Disabled (Fraud)' : 'Accept & Approve Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Child Document Viewer Modal */}
        <DocumentViewerModal
          visible={docViewerModal.visible}
          onClose={() => setDocViewerModal((prev) => ({ ...prev, visible: false }))}
          title={docViewerModal.title}
          url={docViewerModal.url}
          fileName={docViewerModal.fileName}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  fraudReportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  fraudReportHeaderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
  },
  feedbackBanner: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
  },
  feedbackBannerText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },
  fraudBanner: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fraudBannerTitle: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fraudBannerDesc: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  cardWhite: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  shopNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003893',
  },
  addressSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dateSubText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
  },
  badgeAmber: {
    backgroundColor: '#fef3c7',
  },
  badgeStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeFraud: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeFraudText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  incomeCard: {
    backgroundColor: '#003893',
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  incomeLabel: {
    color: '#bfdbfe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  incomeVal: {
    color: '#86efac',
    fontSize: 22,
    fontWeight: '900',
  },
  bankRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankLabel: {
    color: '#dbeafe',
    fontSize: 11,
  },
  bankVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compliancePill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003893',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  callSmallBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  navMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  navMapsBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  docBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  docBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  docNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  docSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  docBadgeAmber: {
    backgroundColor: '#fef3c7',
  },
  docBadgeGray: {
    backgroundColor: '#e2e8f0',
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  docActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  viewDocBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewDocBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  downloadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  downloadDocBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbContainer: {
    width: (SCREEN_WIDTH - 64) / 2,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  photoTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyPhotosBox: {
    alignItems: 'center',
    padding: 20,
    gap: 6,
  },
  emptyPhotosText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  bottomActions: {
    marginTop: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 14,
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },
  approveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  reportFraudBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 14,
  },
  reportFraudBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },
  acceptedBannerBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 14,
  },
  acceptedBannerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
