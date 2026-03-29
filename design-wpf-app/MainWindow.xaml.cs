using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;

namespace design_wpf_app
{
    public partial class MainWindow : Window
    {
        private List<MigrationItem> _items = new();

        public MainWindow()
        {
            InitializeComponent();
            LoadMigrationDb();
            PopulateNavList();
        }

        private void LoadMigrationDb()
        {
            var dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "db", "migration-db.json");
            if (!File.Exists(dbPath))
            {
                // fallback: try relative to exe
                dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "db", "migration-db.json");
            }

            if (File.Exists(dbPath))
            {
                var json = File.ReadAllText(dbPath);
                var db = JsonSerializer.Deserialize<MigrationDb>(json);
                if (db?.items != null)
                    _items = db.items;
            }

            if (_items.Count == 0)
            {
                // Hardcoded fallback
                _items = GetHardcodedItems();
            }
        }

        private void PopulateNavList()
        {
            foreach (var item in _items)
            {
                var statusIcon = item.status switch
                {
                    "변환완료" => "\u2705",
                    "빌드성공" => "\u2705",
                    "테스트완료" => "\u2B50",
                    "수정필요" => "\u26A0\uFE0F",
                    _ => "\u2B1C"
                };

                NavList.Items.Add(new TextBlock
                {
                    Text = $"{statusIcon} {item.displayName}",
                    Foreground = System.Windows.Media.Brushes.White,
                    TextWrapping = TextWrapping.Wrap,
                    Tag = item.id
                });
            }
        }

        private void NavList_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (NavList.SelectedItem is TextBlock tb && tb.Tag is int id)
            {
                var item = _items.FirstOrDefault(i => i.id == id);
                if (item == null) return;

                ContentTitle.Text = item.displayName;
                ContentArea.Content = CreateSampleControl(id);
            }
        }

        private UserControl? CreateSampleControl(int id)
        {
            return id switch
            {
                1 => new Migrated.Sample01_GlassEffectButton(),
                2 => new Migrated.Sample02_AnimatedSidebarMenu(),
                3 => new Migrated.Sample03_RotatingLoadingSpinner(),
                4 => new Migrated.Sample04_SlidingExpandablePanel(),
                5 => new Migrated.Sample05_ColorAnimatedControl(),
                6 => new Migrated.Sample06_FloatingLabelTextbox(),
                7 => new Migrated.Sample07_AnimatedCombobox(),
                8 => new Migrated.Sample08_ToggleSwitch(),
                9 => new Migrated.Sample09_SnackbarToast(),
                10 => new Migrated.Sample10_AnimatedProgressbar(),
                11 => new Migrated.Sample11_BadgeCounterPop(),
                12 => new Migrated.Sample12_PageTransition(),
                13 => new Migrated.Sample13_TabSlide(),
                14 => new Migrated.Sample14_HamburgerToX(),
                15 => new Migrated.Sample15_AnimatedGradientBg(),
                16 => new Migrated.Sample16_ParticleFloatingDots(),
                17 => new Migrated.Sample17_PulsingGlow(),
                18 => new Migrated.Sample18_CherryBlossomFall(),
                19 => new Migrated.Sample19_PetalScatterWind(),
                20 => new Migrated.Sample20_SpringBreezeSway(),
                21 => new Migrated.Sample21_RadialVoiceWave(),
                22 => new Migrated.Sample22_GlitchJitter(),
                23 => new Migrated.Sample23_NeonGlowPulse(),
                24 => new Migrated.Sample24_RgbSplitChromatic(),
                25 => new Migrated.Sample25_ScanlineSweep(),
                26 => new Migrated.Sample26_DigitalMatrixRain(),
                27 => new Migrated.Sample27_HolographicShimmer(),
                _ => null
            };
        }

        private static List<MigrationItem> GetHardcodedItems()
        {
            return new List<MigrationItem>
            {
                new() { id = 1, displayName = "01. Glass Effect Button", status = "변환완료" },
                new() { id = 2, displayName = "02. Animated Sidebar Menu", status = "미완성" },
                new() { id = 3, displayName = "03. Rotating Loading Spinner", status = "미완성" },
                new() { id = 4, displayName = "04. Sliding Expandable Panel", status = "미완성" },
                new() { id = 5, displayName = "05. Color Animated Control", status = "미완성" },
                new() { id = 6, displayName = "06. Floating Label Textbox", status = "미완성" },
                new() { id = 7, displayName = "07. Animated Combobox", status = "미완성" },
                new() { id = 8, displayName = "08. Toggle Switch", status = "미완성" },
                new() { id = 9, displayName = "09. Snackbar Toast", status = "미완성" },
                new() { id = 10, displayName = "10. Animated Progressbar", status = "미완성" },
                new() { id = 11, displayName = "11. Badge Counter Pop", status = "미완성" },
                new() { id = 12, displayName = "12. Page Transition", status = "미완성" },
                new() { id = 13, displayName = "13. Tab Slide", status = "미완성" },
                new() { id = 14, displayName = "14. Hamburger to X", status = "미완성" },
                new() { id = 15, displayName = "15. Animated Gradient BG", status = "미완성" },
                new() { id = 16, displayName = "16. Particle Floating Dots", status = "미완성" },
                new() { id = 17, displayName = "17. Pulsing Glow", status = "미완성" },
                new() { id = 18, displayName = "18. Cherry Blossom Fall", status = "미완성" },
                new() { id = 19, displayName = "19. Petal Scatter Wind", status = "미완성" },
                new() { id = 20, displayName = "20. Spring Breeze Sway", status = "미완성" },
                new() { id = 21, displayName = "21. Radial Voice Wave", status = "미완성" },
                new() { id = 22, displayName = "22. Glitch Jitter", status = "미완성" },
                new() { id = 23, displayName = "23. Neon Glow Pulse", status = "미완성" },
                new() { id = 24, displayName = "24. RGB Split Chromatic", status = "미완성" },
                new() { id = 25, displayName = "25. Scanline Sweep", status = "미완성" },
                new() { id = 26, displayName = "26. Digital Matrix Rain", status = "미완성" },
                new() { id = 27, displayName = "27. Holographic Shimmer", status = "미완성" }
            };
        }
    }

    public class MigrationDb
    {
        public int schemaVersion { get; set; }
        public List<MigrationItem> items { get; set; } = new();
    }

    public class MigrationItem
    {
        public int id { get; set; }
        public string sourceFile { get; set; } = "";
        public string migratedFile { get; set; } = "";
        public string displayName { get; set; } = "";
        public string category { get; set; } = "";
        public string status { get; set; } = "미완성";
        public string notes { get; set; } = "";
    }
}
