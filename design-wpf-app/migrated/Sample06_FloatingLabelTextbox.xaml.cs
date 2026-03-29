using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;

namespace design_wpf_app.Migrated
{
    public partial class Sample06_FloatingLabelTextbox : UserControl
    {
        public Sample06_FloatingLabelTextbox()
        {
            InitializeComponent();
        }

        private void PlayStoryboard(string key)
        {
            var sb = (Storyboard)FindResource(key);
            sb.Begin(this);
        }

        private void Field_GotFocus(object sender, RoutedEventArgs e)
        {
            PlayStoryboard("LabelFloatUp");
        }

        private void Field_LostFocus(object sender, RoutedEventArgs e)
        {
            PlayStoryboard("LabelFloatDown");
        }
    }
}
