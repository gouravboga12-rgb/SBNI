import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Download, ExternalLink, FileText } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  url: string | null;
  fileName?: string;
  type?: 'image' | 'doc';
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  onClose,
  title,
  url,
  fileName,
}) => {
  if (!visible) return null;

  const handleDownloadOrOpen = () => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const isPdf = url ? url.toLowerCase().includes('.pdf') : false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleBox}>
                <FileText size={18} color="#003893" />
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Document / Image Content Area */}
            <View style={styles.contentArea}>
              {url ? (
                isPdf ? (
                  <View style={styles.pdfContainer}>
                    <FileText size={64} color="#dc2626" />
                    <Text style={styles.pdfTitle}>PDF Document</Text>
                    <Text style={styles.pdfSub} numberOfLines={2}>
                      {fileName || title}
                    </Text>
                    <TouchableOpacity
                      style={styles.openExternalBtn}
                      onPress={handleDownloadOrOpen}
                      activeOpacity={0.8}
                    >
                      <ExternalLink size={16} color="#ffffff" />
                      <Text style={styles.openExternalBtnText}>Open / Download PDF</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    contentContainerStyle={styles.imageScrollContent}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.docImage}
                      resizeMode="contain"
                    />
                  </ScrollView>
                )
              ) : (
                <View style={styles.pdfContainer}>
                  <FileText size={48} color="#94a3b8" />
                  <Text style={styles.pdfSub}>No document file attached</Text>
                </View>
              )}
            </View>

            {/* Footer Action */}
            <View style={styles.footer}>
              {url ? (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={handleDownloadOrOpen}
                  activeOpacity={0.8}
                >
                  <Download size={16} color="#ffffff" />
                  <Text style={styles.downloadBtnText}>Download / Open File</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  contentArea: {
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  docImage: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.52,
  },
  pdfContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 8,
  },
  pdfSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  openExternalBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 12,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  doneBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
});
