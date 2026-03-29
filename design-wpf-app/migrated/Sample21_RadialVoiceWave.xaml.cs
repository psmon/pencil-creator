using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace design_wpf_app.Migrated
{
    public partial class Sample21_RadialVoiceWave : UserControl
    {
        public Sample21_RadialVoiceWave()
        {
            InitializeComponent();
            Loaded += OnLoaded;
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            // Remove XAML demo lines before generating full set
            VoiceWaveCanvas.Children.Clear();

            for (int i = 0; i < 60; i++)
            {
                var line = new Line
                {
                    Style = (Style)FindResource("VoiceLineStyle")
                };
                line.RenderTransform = new RotateTransform(i * 6);
                Canvas.SetLeft(line, 200);
                Canvas.SetTop(line, 200);

                // Clone storyboards with staggered BeginTime
                var trimSb = ((Storyboard)FindResource("TrimPathPulse")).Clone();
                trimSb.BeginTime = TimeSpan.FromMilliseconds(i * 40);

                var colorSb = ((Storyboard)FindResource("ColorCascade")).Clone();
                colorSb.BeginTime = TimeSpan.FromMilliseconds(i * 40);

                Storyboard.SetTarget(trimSb, line);
                Storyboard.SetTarget(colorSb, line);

                VoiceWaveCanvas.Children.Add(line);
                trimSb.Begin();
                colorSb.Begin();
            }
        }
    }
}
