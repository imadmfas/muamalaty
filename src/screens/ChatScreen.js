import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Keyboard,
  Linking,
  Alert,
  Share,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "../store/useAppStore";
import { useTheme } from "../theme/ThemeContext";
import { detectIntent } from "../services/aiEngine";
import {
  verifyServiceDetails,
  getConfidenceColor,
  getConfidenceText,
} from "../services/verificationService";
import { GlassCard } from "../components/GlassCard";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { StoreAdapter } from "../engine/index";
import { PathFinder, ConstraintSolver } from "../engine/solver";
import { PathSimulator } from "../engine/simulator";

const GOVERNORATE_OPTIONS = [
  "بغداد",
  "الأنبار",
  "نينوى",
  "البصرة",
  "بابل",
  "النجف الأشرف",
  "كربلاء المقدسة",
];

export const ChatScreen = ({ initialQuery, clearInitialQuery }) => {
  const { theme, isDarkMode, toggleDarkMode, themeConfig } = useTheme();
  const store = useAppStore();
  const { addFavorite, favorites, removeFavorite, addRecentSearch } = store;

  // Wizard steps for a service, computed by the local procedural engine.
  const getEngineWizardSteps = useCallback(
    (service) => {
      try {
        const graph = StoreAdapter.buildGraphFromStore(store);
        const paths = PathFinder.generatePaths(
          graph,
          `service_${service.service_id}`,
        );
        const today = new Date().toISOString().split("T")[0];
        const solved = ConstraintSolver.solveConstraints(graph, paths, today);
        const ranked = PathSimulator.simulateAndRank(graph, solved, today);
        const best = ranked.find((r) => r.isValid) || ranked[0];
        if (best && best.path.steps.length > 0) {
          return best.path.steps.map((step) => ({
            title: step.label,
            body: `المدة المتوقعة: ${step.duration} أيام. ${
              step.requiredDocs.length > 0
                ? `الوثائق: ${step.requiredDocs.join("، ")}`
                : ""
            }`,
          }));
        }
      } catch (error) {
        console.error("Error generating engine steps for Chat Wizard:", error);
      }
      return [
        {
          title: "جمع المستمسكات والأوراق المطلوبة",
          body: "تأكد من توفير كافة الهويات والاستمارات الرسمية",
        },
        {
          title: "تسديد الرسوم أو الحجز الإلكتروني",
          body: service.booking_required
            ? "قم بالحجز عبر الرابط وتجهيز وصل الدفع"
            : "تجهيز الرسوم النقدية للدفع في الدائرة المختصة",
        },
        {
          title: "زيارة الدائرة الصحيحة وإنجاز البصمات",
          body: `التوجه إلى ${service.office_name} في الأوقات الرسمية`,
        },
        {
          title: "استلام المعاملة المنجزة ومطابقة البيانات",
          body: `الفترة المتوقعة للاستلام: ${service.expected_processing_time}`,
        },
      ];
    },
    [store],
  );

  // Engine confidence for a service (null if it cannot be computed).
  const getEngineConfidence = useCallback(
    (service) => {
      try {
        const graph = StoreAdapter.buildGraphFromStore(store);
        const paths = PathFinder.generatePaths(
          graph,
          `service_${service.service_id}`,
        );
        const today = new Date().toISOString().split("T")[0];
        const solved = ConstraintSolver.solveConstraints(graph, paths, today);
        const ranked = PathSimulator.simulateAndRank(graph, solved, today);
        const best = ranked.find((r) => r.isValid) || ranked[0];
        if (best) {
          return PathSimulator.calculateConfidence(
            graph,
            best.path,
            best.isValid,
            today,
          );
        }
      } catch (e) {}
      return null;
    },
    [store],
  );

  // Rejection reason of the best path when it is not valid (null otherwise).
  const getEngineRejectionReason = useCallback(
    (service) => {
      try {
        const graph = StoreAdapter.buildGraphFromStore(store);
        const paths = PathFinder.generatePaths(
          graph,
          `service_${service.service_id}`,
        );
        const today = new Date().toISOString().split("T")[0];
        const solved = ConstraintSolver.solveConstraints(graph, paths, today);
        const ranked = PathSimulator.simulateAndRank(graph, solved, today);
        const best = ranked.find((r) => r.isValid) || ranked[0];
        if (best && !best.isValid) {
          return best.reason;
        }
      } catch (e) {}
      return null;
    },
    [store],
  );

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const networkAnim = useRef(new Animated.Value(0)).current;
  const [selectedService, setSelectedService] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const scrollViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  // Pulse animation of the AI orb while the assistant is "typing".
  useEffect(() => {
    let loop = null;
    if (isTyping) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(0.6);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          sender: "assistant",
          text: "هلو عيني! شلون أقدر أساعدك اليوم؟ اكتبلي شنو المعاملة اللي تريد تسويها (مثلاً: أريد جواز جديد، أجدد سنوية السيارة، أضيف طفل للتموينية) وسأبحثلك بكافة المصادر الرسمية العراقية.",
          timestamp: new Date().toLocaleTimeString("ar-IQ", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
    checkActiveNetwork();
    const keyboardListener = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });
    return () => keyboardListener.remove();
  }, []);

  const checkActiveNetwork = async () => {
    const online = await fetch("https://eservice.ur.gov.iq", { method: "HEAD" })
      .then(() => true)
      .catch(() => false);
    setIsOnline(online);
    Animated.timing(networkAnim, {
      toValue: online ? 0 : 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (initialQuery) {
      handleUserSubmit(initialQuery);
      if (clearInitialQuery) clearInitialQuery();
    }
  }, [initialQuery]);

  const addMessage = (message) => {
    const newMessage = {
      ...message,
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  };

  const handleUserSubmit = async (text) => {
    if (!text.trim()) return;
    setInputText("");
    addMessage({ sender: "user", text });
    addRecentSearch(text);
    setIsTyping(true);
    try {
      const intent = detectIntent(text);

      if (intent.needsDetails && intent.matchedService) {
        setIsTyping(false);
        setSelectedService(intent.matchedService);
        let options;
        if (intent.matchedService.service_id.includes("passport")) {
          options = ["إصدار جواز سفر لأول مرة", "تجديد جواز سفر منتهي"];
        } else if (intent.matchedService.service_id.includes("nid")) {
          options = [
            "إصدار البطاقة لأول مرة",
            "تحديث بيانات البطاقة",
            "إصدار بدل ضائع للموحدة",
          ];
        } else {
          options = ["معاملة جديدة", "تجديد معاملة سابقة"];
        }
        addMessage({
          sender: "assistant",
          text: `صار عيني، بخصوص ${intent.matchedService.service_name_ar}، شنو المطلوب بالضبط من هذي الخيارات؟`,
          isFollowUp: true,
          followUpType: "details",
          suggestedOptions: options,
        });
        return;
      }

      if (intent.matchedService) {
        setSelectedService(intent.matchedService);
        setIsTyping(false);
        addMessage({
          sender: "assistant",
          text: `أهلاً بك عيني! قبل لا أطلعلك التعليمات الخاصة بـ (${intent.matchedService.service_name_ar})، من يا محافظة أنت حتى أدليك على أقرب مكتب ودائرة إلك؟`,
          isFollowUp: true,
          followUpType: "governorate",
          suggestedOptions: GOVERNORATE_OPTIONS,
        });
        return;
      }

      setIsTyping(false);
      addMessage({
        sender: "assistant",
        text: "عذراً عيني، ما لقيت معاملة مطابقة لكلامك بالضبط. جرب تكتب بكلمات أوضح مثل (جواز، إجازة سوق، سنوية، بطاقة تموينية، طابو)... أو شوف الاقتراحات الجوا 👇",
        suggestedOptions: [
          "إصدار جواز",
          "بطاقة وطنية",
          "إجازة سوق",
          "تجديد سنوية",
          "إضافة مولود للتموينية",
        ],
      });
    } catch (error) {
      setIsTyping(false);
      addMessage({
        sender: "assistant",
        text: "صار خلل بسيط عيني بالشبكة، يرجى المحاولة مرة ثانية.",
      });
    }
  };

  const handleFollowUpSelect = async (option, followUpType) => {
    addMessage({ sender: "user", text: option });
    setIsTyping(true);

    if (followUpType === "governorate") {
      setSelectedGovernorate(option);
      if (!selectedService) {
        setIsTyping(false);
        addMessage({
          sender: "assistant",
          text: "صار خلل بتحديد المعاملة، اكتبلي يا معاملة تريد من جديد فدوة.",
        });
        return;
      }
      return await executeVerificationPipeline(selectedService, option);
    } else if (followUpType === "details") {
      const intent = detectIntent(option);
      const service = intent.matchedService || selectedService;
      if (!service) {
        setIsTyping(false);
        addMessage({
          sender: "assistant",
          text: "صار عندي التباس، أعد كتابة طلبك بوضوح أكثر فدوة.",
        });
        return;
      }
      setSelectedService(service);
      setIsTyping(false);
      addMessage({
        sender: "assistant",
        text: `تمام عيني، حددنا المعاملة: (${service.service_name_ar}). من يا محافظة أنت فدوة؟`,
        isFollowUp: true,
        followUpType: "governorate",
        suggestedOptions: GOVERNORATE_OPTIONS,
      });
    }
  };

  const executeVerificationPipeline = async (service, governorate) => {
    try {
      setLoadingStatus("جاري فحص اتصال الإنترنت والتحقق...");
      await new Promise((resolve) => setTimeout(resolve, 600));

      const online = await fetch("https://eservice.ur.gov.iq", {
        method: "HEAD",
      })
        .then(() => true)
        .catch(() => false);
      setIsOnline(online);

      if (online) {
        setLoadingStatus(
          "تم الاتصال! جاري سحب البيانات من البوابات الرسمية ومقارنتها...",
        );
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoadingStatus(
          "جاري مطابقة مصادر: بوابة أور 🔗، مديريات وزارة الداخلية والمالية 🔗...",
        );
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoadingStatus(
          "جاري تحديث كاش التطبيق وتأكيد الرسوم والدائرة المختصة...",
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      } else {
        setLoadingStatus(
          "لا يوجد إنترنت! جاري تفعيل وضع دون اتصال (Offline Fallback)...",
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const verification = await verifyServiceDetails(service, online);

      const serviceResult = { ...verification.service };
      serviceResult.governorate = governorate;
      serviceResult.office_address = `دائرة ${service.category} في مركز محافظة ${governorate}، العراق`;
      serviceResult.google_maps_link = `https://www.google.com/maps/search/?api=1&query=دائرة+${encodeURIComponent(
        service.category,
      )}+${encodeURIComponent(governorate)}`;

      setIsTyping(false);
      setLoadingStatus("");

      let responseText = `لقيتلك كافة المتمتلكات والإجراءات الخاصة بـ **${serviceResult.service_name_ar}** لمحافظة **${governorate}** عيني.`;
      if (verification.isOffline) {
        responseText =
          responseText +
          "\n⚠️ (تم الاسترداد من قاعدة البيانات المحلية المحفوظة لعدم توفر اتصال بالإنترنت).";
      }

      addMessage({
        sender: "assistant",
        text: responseText,
        serviceResult,
        confidenceScore: verification.confidenceScore,
        sourceType: verification.sourceType,
        isOffline: verification.isOffline,
        completedWizardSteps: [],
      });
      setSelectedService(null);
      setSelectedGovernorate("");
    } catch (error) {
      setIsTyping(false);
      setLoadingStatus("");
      addMessage({
        sender: "assistant",
        text: "عذراً عيني، صار خطأ أثناء التحقق، سحبتلك المعلومات المخزنة محلياً.",
        serviceResult: service,
        confidenceScore: 65,
        sourceType: "local_database",
        isOffline: true,
      });
    }
  };

  const toggleWizardStep = (messageId, stepIndex) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const completed = msg.completedWizardSteps || [];
        const updated = completed.includes(stepIndex)
          ? completed.filter((i) => i !== stepIndex)
          : [...completed, stepIndex];
        return { ...msg, completedWizardSteps: updated };
      }),
    );
  };

  const handleShare = async (service) => {
    const docsList = service.required_documents
      .map((doc, index) => `${index + 1}. ${doc}`)
      .join("\n");
    const message =
      "\n*تطبيق معاملاتي - دليل المعاملات الحكومية*\nالخدمة: " +
      service.service_name_ar +
      "\nالوزارة: " +
      service.ministry_name +
      "\nالرسوم التقريبية: " +
      service.estimated_fees_iqd.toLocaleString() +
      " دينار عراقي\nالمستمسكات المطلوبة:\n" +
      docsList +
      "\n    ";
    try {
      await Share.share({ message, title: service.service_name_ar });
    } catch (error) {
      Alert.alert("خطأ", "فشل مشاركة البيانات");
    }
  };

  const textPrimaryStyle = { color: theme.textPrimary };
  const textSecondaryStyle = { color: theme.textSecondary };
  // theme.cardMain / theme.border were read here in the original without being used.

  const bannerHeight = networkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 36],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={[styles.mainContainer, { backgroundColor: theme.background }]}
      >
        <Animated.View
          style={[
            styles.networkBanner,
            { height: bannerHeight, backgroundColor: theme.danger },
          ]}
        >
          <Text style={styles.networkBannerText}>
            ⚠️ وضع دون اتصال (أوفلاين) - البيانات المسترجعة محفوظة محلياً
          </Text>
        </Animated.View>

        <View style={styles.topHeaderRow}>
          <View style={styles.headerLeftActions}>
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={toggleDarkMode}
              activeOpacity={0.8}
            >
              <Feather
                name={isDarkMode ? "sun" : "moon"}
                size={13}
                color={theme.textPrimary}
              />
              <Text
                style={[styles.themeToggleText, { color: theme.textSecondary }]}
              >
                {isDarkMode ? "فاتح" : "داكن"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRightText}>
            <Text style={[styles.headerTitleText, textPrimaryStyle]}>
              المساعد الذكي موسى
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isAssistant = msg.sender === "assistant";

            let resultCard = null;
            if (msg.serviceResult) {
              const score =
                getEngineConfidence(msg.serviceResult) ||
                msg.confidenceScore ||
                50;
              const rejectionReason = getEngineRejectionReason(
                msg.serviceResult,
              );
              const isFavorite = favorites.includes(
                msg.serviceResult.service_id,
              );

              resultCard = (
                <View
                  style={[
                    styles.serviceResultCard,
                    { borderTopColor: theme.border },
                  ]}
                >
                  <>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: getConfidenceColor(score) },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row-reverse",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Feather
                            name={
                              score >= 75 ? "check-circle" : "alert-triangle"
                            }
                            size={12}
                            color="black"
                          />
                          <Text style={styles.scoreBadgeText}>
                            {getConfidenceText(score)}
                            {" ("}
                            {score}
                            {"%)"}
                          </Text>
                        </View>
                      </View>
                      {msg.isOffline && (
                        <View
                          style={[
                            styles.offlineBadge,
                            { backgroundColor: theme.danger },
                          ]}
                        >
                          <Text style={styles.offlineBadgeText}>
                            مصدر محلي محفوظ
                          </Text>
                        </View>
                      )}
                    </View>
                    {rejectionReason && (
                      <View
                        style={[
                          styles.uncertainBanner,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(239, 68, 68, 0.05)"
                              : "rgba(239, 68, 68, 0.08)",
                            borderColor: theme.danger,
                            marginTop: 10,
                          },
                        ]}
                      >
                        <Feather
                          name="alert-octagon"
                          size={16}
                          color={theme.danger}
                          style={{ marginLeft: 6 }}
                        />
                        <Text
                          style={[
                            styles.uncertainText,
                            { color: theme.danger, fontSize: 11 },
                          ]}
                        >
                          {rejectionReason}
                        </Text>
                      </View>
                    )}
                  </>

                  {msg.confidenceScore && msg.confidenceScore < 50 && (
                    <View
                      style={[
                        styles.uncertainBanner,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(249, 112, 102, 0.08)"
                            : "rgba(240, 68, 56, 0.08)",
                          borderColor: theme.danger,
                        },
                      ]}
                    >
                      <Feather
                        name="alert-circle"
                        size={16}
                        color={theme.danger}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[styles.uncertainText, { color: theme.danger }]}
                      >
                        هذه المعلومة غير مؤكدة وتحتاج مراجعة الدائرة المختصة.
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.serviceTitle, textPrimaryStyle]}>
                    {"📋 "}
                    {msg.serviceResult.service_name_ar}
                  </Text>
                  <Text style={[styles.serviceMeta, textSecondaryStyle]}>
                    {"🏢 "}
                    {msg.serviceResult.ministry_name}
                    {" - "}
                    {msg.serviceResult.department_name}
                  </Text>

                  <View
                    style={[
                      styles.detailsSection,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <Feather
                        name="file-text"
                        size={16}
                        color={theme.primaryBrand}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[
                          styles.sectionHeader,
                          { color: theme.primaryBrand },
                        ]}
                      >
                        المستمسكات المطلوبة (الأساسية):
                      </Text>
                    </View>
                    {msg.serviceResult.required_documents.map((doc, index) => (
                      <Text
                        key={index}
                        style={[styles.docItem, textPrimaryStyle]}
                      >
                        {"• "}
                        {doc}
                      </Text>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.detailsSection,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <Feather
                        name="credit-card"
                        size={16}
                        color={theme.primaryBrand}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[
                          styles.sectionHeader,
                          { color: theme.primaryBrand },
                        ]}
                      >
                        الرسوم وطريقة الدفع:
                      </Text>
                    </View>
                    <Text style={[styles.feeText, textPrimaryStyle]}>
                      {msg.serviceResult.estimated_fees_iqd > 0
                        ? `${msg.serviceResult.estimated_fees_iqd.toLocaleString()} دينار عراقي`
                        : "مجانية بالكامل"}
                    </Text>
                    <Text style={[styles.paymentMethod, textSecondaryStyle]}>
                      {"💳 "}
                      {msg.serviceResult.payment_method}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.detailsSection,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <Feather
                        name="map-pin"
                        size={16}
                        color={theme.primaryBrand}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[
                          styles.sectionHeader,
                          { color: theme.primaryBrand },
                        ]}
                      >
                        مكان التقديم وأقرب دائرة:
                      </Text>
                    </View>
                    <Text style={[styles.officeName, textPrimaryStyle]}>
                      {"📍 "}
                      {msg.serviceResult.office_name}
                      {" ("}
                      {msg.serviceResult.governorate}
                      {")"}
                    </Text>
                    <Text style={[styles.officeAddress, textPrimaryStyle]}>
                      {msg.serviceResult.office_address}
                    </Text>
                    <Text style={[styles.workingHours, textPrimaryStyle]}>
                      {"🕒 أيام العمل: "}
                      {msg.serviceResult.working_days.join("، ")}
                      {" ("}
                      {msg.serviceResult.working_hours}
                      {")"}
                    </Text>
                    <TouchableOpacity
                      style={styles.mapLinkButton}
                      onPress={() =>
                        Linking.openURL(
                          msg.serviceResult?.google_maps_link || "",
                        )
                      }
                    >
                      <LinearGradient
                        colors={[theme.primaryBrand, theme.secondaryAccent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mapBtnGrad}
                      >
                        <Text style={styles.mapLinkText}>
                          🗺️ فتح موقع الملاحة و Google Maps
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {msg.serviceResult.citizen_notes ? (
                    <View
                      style={[
                        styles.notesBox,
                        {
                          backgroundColor: theme.warning + "14",
                          borderColor: theme.warning + "33",
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Feather
                          name="info"
                          size={14}
                          color={theme.warning}
                          style={{ marginLeft: 6 }}
                        />
                        <Text
                          style={[styles.notesTitle, { color: theme.warning }]}
                        >
                          تنبيهات هامة للمواطن:
                        </Text>
                      </View>
                      <Text
                        style={[styles.notesText, { color: theme.warning }]}
                      >
                        {msg.serviceResult.citizen_notes}
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.notesBox,
                      {
                        backgroundColor: theme.primaryBrand + "14",
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Feather
                        name="shield"
                        size={14}
                        color={theme.primaryBrand}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[
                          styles.notesTitle,
                          { color: theme.primaryBrand },
                        ]}
                      >
                        المصدر الرسمي وتاريخ التحقق:
                      </Text>
                    </View>
                    <Text
                      style={[styles.notesText, { color: theme.textSecondary }]}
                    >
                      {"🏛️ المصدر المعتمد: "}
                      {msg.serviceResult.last_source_check ||
                        "بوابة أور الحكومية - الأمانة العامة لمجلس الوزراء"}
                    </Text>
                    <Text
                      style={[styles.notesText, { color: theme.textSecondary }]}
                    >
                      {"⏱️ تاريخ آخر مراجعة للبيانات: "}
                      {msg.serviceResult.last_verified_date || "2026-05-20"}
                    </Text>
                    {msg.serviceResult.online_service_link ? (
                      <TouchableOpacity
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          backgroundColor: theme.primaryBrand + "1F",
                          height: 32,
                          borderRadius: 8,
                          marginTop: 8,
                        }}
                        onPress={() =>
                          Linking.openURL(
                            msg.serviceResult?.online_service_link || "",
                          )
                        }
                      >
                        <Feather
                          name="globe"
                          size={12}
                          color={theme.primaryBrand}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "bold",
                            color: theme.primaryBrand,
                          }}
                        >
                          فتح بوابة التقديم الإلكتروني الرسمي
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.wizardHeaderContainer,
                      { borderTopColor: theme.border },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Feather
                        name="activity"
                        size={16}
                        color={theme.primaryBrand}
                        style={{ marginLeft: 6 }}
                      />
                      <Text
                        style={[
                          styles.wizardHeaderTitle,
                          { color: theme.primaryBrand },
                        ]}
                      >
                        معالج وخطوات إنجاز معاملتك:
                      </Text>
                    </View>
                  </View>

                  <View style={styles.wizardContainer}>
                    {getEngineWizardSteps(msg.serviceResult).map(
                      (step, index) => {
                        const isDone =
                          msg.completedWizardSteps?.includes(index);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.wizardStepCard,
                              isDone && {
                                backgroundColor: theme.success + "0A",
                                borderColor: theme.success + "33",
                              },
                              { borderColor: theme.border },
                            ]}
                            onPress={() => toggleWizardStep(msg.id, index)}
                          >
                            <View style={styles.wizardStepCheckbox}>
                              <Ionicons
                                name={isDone ? "checkbox" : "square-outline"}
                                size={20}
                                color={isDone ? theme.success : theme.textMuted}
                              />
                            </View>
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text
                                style={[
                                  styles.wizardStepTitle,
                                  isDone && styles.lineThrough,
                                  textPrimaryStyle,
                                ]}
                              >
                                {step.title}
                              </Text>
                              <Text
                                style={[
                                  styles.wizardStepBody,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {step.body}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      },
                    )}
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: theme.border,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => handleShare(msg.serviceResult)}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        📤 مشاركة
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        isFavorite
                          ? { backgroundColor: theme.primaryBrand }
                          : {
                              backgroundColor: theme.backgroundSecondary,
                              borderColor: theme.border,
                              borderWidth: 1,
                            },
                      ]}
                      onPress={() => {
                        if (favorites.includes(msg.serviceResult.service_id)) {
                          removeFavorite(msg.serviceResult.service_id);
                          Alert.alert("تم", "أزيلت المعاملة من المفضلة");
                        } else {
                          addFavorite(msg.serviceResult.service_id);
                          Alert.alert(
                            "تم",
                            "تم حفظ المعاملة في المفضلة بنجاح!",
                          );
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          isFavorite
                            ? { color: isDarkMode ? theme.background : "white" }
                            : { color: theme.textPrimary },
                        ]}
                      >
                        {isFavorite ? "⭐ محفوظة" : "⭐ حفظ للمفضلة"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isAssistant ? styles.rowAssistant : styles.rowUser,
                ]}
              >
                <LinearGradient
                  colors={
                    isAssistant
                      ? [theme.primaryBrand, theme.secondaryAccent]
                      : [theme.success, theme.secondaryAccent]
                  }
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {isAssistant ? "🤖" : "👤"}
                  </Text>
                </LinearGradient>

                <View
                  style={{
                    flex: 1,
                    alignItems: isAssistant ? "flex-end" : "flex-start",
                  }}
                >
                  <View
                    style={[
                      styles.bubble,
                      isAssistant
                        ? [
                            styles.bubbleAssistant,
                            {
                              backgroundColor: theme.cardMain,
                              borderColor: theme.border,
                            },
                          ]
                        : [
                            styles.bubbleUser,
                            { backgroundColor: theme.primaryBrand },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: isAssistant
                            ? theme.textPrimary
                            : isDarkMode
                              ? theme.background
                              : "white",
                        },
                      ]}
                    >
                      {msg.text}
                    </Text>

                    {resultCard}

                    {msg.suggestedOptions &&
                      msg.suggestedOptions.length > 0 && (
                        <View style={styles.suggestionsWrapper}>
                          {msg.suggestedOptions.map((option, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.suggestionChip,
                                { backgroundColor: theme.primaryBrand },
                              ]}
                              onPress={() =>
                                handleFollowUpSelect(
                                  option,
                                  msg.followUpType || "details",
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.suggestionChipText,
                                  {
                                    color: isDarkMode
                                      ? theme.background
                                      : "white",
                                  },
                                ]}
                              >
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                  </View>
                  <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={styles.loadingWrapper}>
              <View style={styles.checkingCard}>
                <SkeletonLoader />
                <View style={styles.statusLabelContainer}>
                  <View style={styles.aiOrbRow}>
                    <Animated.View
                      style={[
                        styles.aiPulseOrb,
                        {
                          backgroundColor: theme.primaryBrand,
                          shadowColor: theme.primaryBrand,
                          transform: [{ scale: pulseAnim }],
                          opacity: pulseAnim.interpolate({
                            inputRange: [0.6, 1.1],
                            outputRange: [0.4, 0.8],
                          }),
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.aiCoreOrb,
                        { backgroundColor: theme.primaryBrand },
                      ]}
                    />
                    <Text style={[styles.loadingSub, textPrimaryStyle]}>
                      {loadingStatus || "جاري التحقق ومطابقة القنوات..."}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <GlassCard
          borderColor={theme.border}
          style={[styles.inputContainer, { backgroundColor: theme.cardMain }]}
          glow={true}
        >
          <View style={styles.inputRow}>
            <TextInput
              placeholder="اكتب رسالتك أو استفسارك هنا..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.chatInput,
                { color: theme.textPrimary, textAlign: "right", maxHeight: 80 },
              ]}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleUserSubmit(inputText)}
              editable={!isTyping}
              multiline={true}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputText.trim() && !isTyping ? 1 : 0.6 },
              ]}
              onPress={() => handleUserSubmit(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <LinearGradient
                colors={[theme.primaryBrand, theme.secondaryAccent]}
                style={styles.sendGrad}
              >
                <Text style={[styles.sendButtonText, { color: "white" }]}>
                  أرسل
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  networkBanner: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  networkBannerText: { color: "white", fontSize: 11, fontWeight: "bold" },
  scrollContent: { padding: 16, paddingTop: 10, paddingBottom: 180 },
  messageRow: {
    flexDirection: "row-reverse",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  rowAssistant: { alignSelf: "stretch" },
  rowUser: { alignSelf: "stretch" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 4,
    elevation: 3,
  },
  avatarText: { fontSize: 20 },
  bubble: { maxWidth: "92%", borderRadius: 22, padding: 16, elevation: 2 },
  bubbleAssistant: { borderTopRightRadius: 2, borderWidth: 1 },
  bubbleUser: { borderTopLeftRadius: 2, alignSelf: "flex-start" },
  messageText: { fontSize: 14.5, lineHeight: 22, textAlign: "right" },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    marginRight: 6,
    alignSelf: "flex-end",
  },
  suggestionsWrapper: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionChipText: { fontSize: 12.5, fontWeight: "bold" },
  loadingWrapper: { marginVertical: 10, alignItems: "center", width: "100%" },
  checkingCard: { width: "100%", position: "relative" },
  statusLabelContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingSub: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
  inputContainer: {
    margin: 12,
    marginBottom: 95,
    padding: 6,
    borderRadius: 28,
    borderWidth: 1,
  },
  aiOrbRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  aiPulseOrb: {
    position: "absolute",
    right: 20,
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  aiCoreOrb: { width: 8, height: 8, borderRadius: 4, zIndex: 2, marginLeft: 6 },
  inputRow: { flexDirection: "row-reverse", alignItems: "center" },
  chatInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    paddingTop: 8,
  },
  sendButton: {
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  sendGrad: {
    paddingHorizontal: 22,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: { fontWeight: "bold" },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 25,
  },
  headerLeftActions: { flexDirection: "row", alignItems: "center" },
  themeToggleBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
  },
  themeToggleText: { fontSize: 11, fontWeight: "bold" },
  headerRightText: { alignItems: "flex-end" },
  headerTitleText: { fontSize: 18, fontWeight: "bold" },
  serviceResultCard: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  badgeRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  scoreBadgeText: { color: "black", fontSize: 11, fontWeight: "bold" },
  offlineBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  offlineBadgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  uncertainBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  uncertainText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    flex: 1,
  },
  serviceTitle: { fontSize: 19, fontWeight: "bold", textAlign: "right" },
  serviceMeta: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
    marginBottom: 14,
  },
  detailsSection: { marginTop: 14, borderBottomWidth: 1, paddingBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeader: { fontSize: 13.5, fontWeight: "bold", textAlign: "right" },
  docItem: {
    fontSize: 13.5,
    textAlign: "right",
    marginBottom: 4,
    lineHeight: 18,
  },
  feeText: { fontSize: 17, fontWeight: "bold", textAlign: "right" },
  paymentMethod: { fontSize: 12, textAlign: "right", marginTop: 2 },
  officeName: { fontSize: 14.5, fontWeight: "bold", textAlign: "right" },
  officeAddress: { fontSize: 12.5, textAlign: "right", marginTop: 2 },
  workingHours: { fontSize: 11.5, textAlign: "right", marginTop: 2 },
  mapLinkButton: { borderRadius: 12, overflow: "hidden", marginTop: 12 },
  mapBtnGrad: { paddingVertical: 12, alignItems: "center" },
  mapLinkText: { color: "white", fontSize: 12.5, fontWeight: "bold" },
  notesBox: { borderRadius: 14, padding: 12, marginTop: 14, borderWidth: 1 },
  notesTitle: { fontSize: 13, fontWeight: "bold", textAlign: "right" },
  notesText: { fontSize: 12, textAlign: "right", marginTop: 4, lineHeight: 18 },
  cardDisclaimer: {
    fontSize: 10,
    color: "gray",
    textAlign: "right",
    marginTop: 12,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: { fontSize: 13, fontWeight: "bold" },
  wizardHeaderContainer: { marginTop: 22, borderTopWidth: 1, paddingTop: 16 },
  wizardHeaderTitle: { fontSize: 14, fontWeight: "bold", textAlign: "right" },
  wizardContainer: { gap: 10 },
  wizardStepCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  wizardStepCheckbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  wizardStepTitle: { fontSize: 13, fontWeight: "bold", textAlign: "right" },
  wizardStepBody: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
    lineHeight: 15,
  },
  lineThrough: { textDecorationLine: "line-through", opacity: 0.6 },
});
